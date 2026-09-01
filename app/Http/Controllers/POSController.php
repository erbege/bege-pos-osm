<?php

namespace App\Http\Controllers;

use App\Domain\Reservation\Enums\ReservationStatus;
use App\Models\Category;
use App\Models\Menu;
use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use App\Services\Order\OrderItemService;
use App\Services\Order\OrderPaymentService;
use App\Services\Order\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

use App\Models\Setting;

class POSController extends Controller
{
    /**
     * Display the POS interface.
     */
    public function index()
    {
        $categories = Category::all();
        $menus = Menu::with('category')->where('is_available', true)->get();
        $today = now()->toDateString();
        
        // Get Printer Settings
        $printerSettings = Setting::where('group', 'cashier_printer')->pluck('value', 'key');
        
        // Get POS General Settings (Tax, etc)
        $posSettings = Setting::whereIn('group', ['pos_settings', 'business_info'])->get()->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->value];
        });

        $rooms = \App\Models\Room::with([
            'tables.activeOrder.items.menu',
            'tables.reservations' => function ($q) use ($today) {
                $q->where('reservation_date', $today)
                    ->whereIn('status', [
                        ReservationStatus::Confirmed->value,
                        ReservationStatus::Preparing->value,
                        ReservationStatus::Ready->value,
                        ReservationStatus::CheckedIn->value,
                    ])
                    ->orderBy('start_time');
            },
        ])->get();

        $todayReservations = \App\Models\Reservation::with('tables')
            ->where('reservation_date', $today)
            ->whereIn('status', [
                ReservationStatus::PendingPayment->value,
                ReservationStatus::Confirmed->value,
                ReservationStatus::Preparing->value,
                ReservationStatus::Ready->value,
            ])
            ->orderBy('start_time')
            ->get();

        // Get users who can act as cashier for shift change (excluding current user)
        $currentUserId = Auth::id();
        $shiftUsers = \App\Models\User::role(['cashier', 'manager', 'owner'])->where('id', '!=', $currentUserId)->get();

        // Get top 10 best-selling items
        $recommendedMenus = Menu::where('is_available', true)
            ->withSum('orderItems as total_sold', 'qty')
            ->orderByDesc('total_sold')
            ->take(10)
            ->get();

        // Get active discounts for automatic or manual application
        $discounts = \App\Models\Discount::where('is_active', true)
            ->where(function($q) use ($today) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $today);
            })
            ->where(function($q) use ($today) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $today);
            })
            ->get();

        return Inertia::render('POS/Index', [
            'categories' => $categories,
            'menus' => $menus,
            'rooms' => $rooms,
            'shiftUsers' => $shiftUsers,
            'todayReservations' => $todayReservations,
            'recommendedMenus' => $recommendedMenus,
            'printerSettings' => $printerSettings,
            'posSettings' => $posSettings,
            'discounts' => $discounts,
        ]);
    }

    /**
     * Switch current POS shift to another user.
     */
    public function switchShift(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'password' => 'required|string',
        ]);

        $targetUser = User::findOrFail($request->user_id);

        if (! Hash::check($request->password, $targetUser->password)) {
            return back()->withErrors(['password' => 'Password salah untuk user '.$targetUser->name]);
        }

        Auth::logout();
        Auth::loginUsingId($targetUser->id);

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('pos.index')->with('success', 'Shift berhasil dipindahkan ke '.$targetUser->name);
    }

    /**
     * Process a new POS order using the Service Layer.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'nullable|exists:orders,id',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.modifier_ids' => 'nullable|array',
            'items.*.modifier_ids.*' => 'exists:modifiers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'table_id' => 'nullable|exists:tables,id',
            'discount_code' => 'nullable|string',
            'manual_discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:Cash,QRIS,Transfer,EDC,SAVE',
        ]);

        try {
            DB::beginTransaction();

            // 0. Resolve the Discount object or manual amount
            $discount = null;
            if (! empty($validated['discount_code'])) {
                $discount = \App\Models\Discount::where('code', $validated['discount_code'])->first();
            }
            
            // If not a formal voucher but we have a manual amount, use the amount
            if (!$discount && !empty($validated['manual_discount_amount'])) {
                $discount = $validated['manual_discount_amount'];
            }

            // 1. Resolve or Create Order Object
            if (! empty($validated['order_id'])) {
                $order = Order::find($validated['order_id']);

                if ($order) {
                    // Release existing stock reservations before updating
                    app(\App\Services\Inventory\InventoryEngineService::class)->releaseStock($order);

                    // Clear old items to re-sync
                    $order->items()->delete();
                    $order->update([
                        'table_id' => $validated['table_id'] ?? $order->table_id,
                        'customer_name' => $validated['customer_name'] ?? $order->customer_name,
                        'customer_phone' => $validated['customer_phone'] ?? $order->customer_phone,
                        'order_type' => !empty($validated['table_id']) ? 'DINE_IN' : 'TAKEAWAY',
                    ]);
                } else {
                    // If order_id was provided but not found in DB (e.g. deleted), create a new one
                    $order = app(OrderService::class)->create([
                        'table_id' => $validated['table_id'] ?? null,
                        'customer_name' => $validated['customer_name'] ?? null,
                        'customer_phone' => $validated['customer_phone'] ?? null,
                        'order_channel' => 'POS',
                        'order_type' => !empty($validated['table_id']) ? 'DINE_IN' : 'TAKEAWAY',
                    ]);
                }
            } else {
                $order = app(OrderService::class)->create([
                    'table_id' => $validated['table_id'] ?? null,
                    'customer_name' => $validated['customer_name'] ?? null,
                    'customer_phone' => $validated['customer_phone'] ?? null,
                    'order_channel' => 'POS',
                    'order_type' => !empty($validated['table_id']) ? 'DINE_IN' : 'TAKEAWAY',
                ]);
            }

            // 2. Add Items securely relying on DB prices
            app(OrderItemService::class)->addItemsBulk($order, $validated['items']);

            // 3. Dispatch OrderCreated for inventory reservation (if new items added)
            // Note: We might want to refine this if we are only updating, but for now re-reserve is safe
            event(new \App\Events\OrderCreated($order));

            // Reload relationships so calculations and inventory deduction have fresh data
            $order->load(['items.menu', 'reservation']);

            // 3. Checkout calculations to update totals
            $order = app(OrderService::class)->checkout($order, $discount);

            // 4. Process Payment based on method
            $isSaved = strtoupper($validated['payment_method']) === 'SAVE';
            $isQris = strtoupper($validated['payment_method']) === 'QRIS';
            $isTransfer = strtoupper($validated['payment_method']) === 'TRANSFER';
            
            if ($isSaved) {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'message' => 'Order saved successfully.',
                    'order' => $order
                ]);
            }

            $responseData = [];

            if ($isQris) {
                $paymentData = app(\App\Services\Payment\PaymentService::class)->create($order, 'QRIS');
                $responseData = [
                    'success' => true,
                    'qr_url' => $paymentData['qr_url'],
                ];
            } elseif ($isTransfer) {
                $paymentData = app(\App\Services\Payment\PaymentService::class)->create($order, 'BANK_TRANSFER', $request->payment_channel);
                $responseData = [
                    'success' => true,
                    'virtual_account' => $paymentData['virtual_account'],
                    'expired_at' => $paymentData['expired_at'],
                    'bank' => $request->payment_channel,
                ];
            } elseif (strtoupper($validated['payment_method']) === 'EDC') {
                // Standalone EDC integration - manual approval code
                app(OrderPaymentService::class)->markAsPaid($order, 'EDC', $request->approval_code);
            } else {
                // Instantly mark Cash as paid
                app(OrderPaymentService::class)->markAsPaid($order, $validated['payment_method']);
            }

            // 2. Resolve Table Status
            if (! empty($validated['table_id'])) {
                $tableModel = Table::find($validated['table_id']);
                if ($tableModel) {
                    $tableModel->update(['status' => 'occupied']);
                    event(new \App\Events\TableStatusUpdated($tableModel));
                }
            }

            // 5. Fire Customer WhatsApp Notification asynchronously
            if (! $isSaved) {
                try {
                    \Illuminate\Support\Facades\Notification::route('fonnte', $order->customer_phone ?? '08123456789')
                        ->notify(new \App\Notifications\CustomerOrderNotification($order));
                } catch (\Exception $e) {
                    \Log::error('POS Notification Error: ' . $e->getMessage());
                }
            }

            DB::commit();

            if (($isQris || $isTransfer) && $request->expectsJson()) {
                return response()->json($responseData);
            }

            return redirect()->route('pos.index')->with('success', 'Order processed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process order. '.$e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to process order. '.$e->getMessage()]);
        }
    }

    /**
     * Check-in a reservation at the POS.
     */
    public function checkIn(Request $request, \App\Models\Reservation $reservation)
    {
        try {
            DB::beginTransaction();

            // 1. Mark status as CheckedIn
            $reservation->transitionTo(ReservationStatus::CheckedIn);

            // 2. Ensure Order exists (created by kitchen sync or now)
            $order = $reservation->order;
            if (! $order) {
                $order = app(OrderService::class)->create([
                    'table_id' => $reservation->tables()->first()?->id,
                    'reservation_id' => $reservation->id,
                ]);

                // Add pre-ordered items
                foreach ($reservation->menus as $rm) {
                    app(OrderItemService::class)->addItem(
                        $order,
                        $rm->menu_id,
                        $rm->quantity
                    );
                }

                $reservation->update(['order_id' => $order->id]);
            }

            // 3. Mark Table as Occupied
            foreach ($reservation->tables as $table) {
                $table->update(['status' => 'occupied']);
                event(new \App\Events\TableStatusUpdated($table));
            }

            DB::commit();

            return redirect()->back()->with('success', "Reservation #{$reservation->reservation_number} checked-in!");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Check-in failed: '.$e->getMessage());
        }
    }
}
