<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Menu;
use App\Models\Category;
use App\Models\Table;
use App\Models\Order;
use App\Services\Order\OrderService;
use App\Services\Order\OrderItemService;
use App\Services\Order\OrderPaymentService;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CustomerOrderNotification;

class CustomerController extends Controller
{
    /**
     * Display the customer menu.
     */
    public function index(Request $request)
    {
        if ($request->has('branch_id')) {
            session(['active_branch_id' => $request->branch_id]);
        }

        if ($request->has('table_id')) {
            $table = Table::withoutGlobalScopes()->find($request->table_id);
            if ($table) {
                session(['active_branch_id' => $table->branch_id]);
                session(['active_table_id' => $table->id]);
            }
        }

        $activeTable = session('active_table_id') ? Table::withoutGlobalScopes()->find(session('active_table_id')) : null;

        return Inertia::render('Customer/Menu', array_merge([
            'menus' => Menu::with('category')->where('is_available', true)->get(),
            'categories' => Category::all(),
            'activeTableId' => session('active_table_id'),
            'activeTableName' => $activeTable?->name,
            'activeBranchId' => session('active_branch_id'),
        ], $this->getCommonProps()));
    }

    /**
     * Show Cart page.
     */
    public function cart()
    {
        return Inertia::render('Customer/Cart', $this->getCommonProps());
    }

    /**
     * Show Checkout page.
     */
    public function checkoutView()
    {
        return Inertia::render('Customer/Checkout', $this->getCommonProps());
    }

    /**
     * Helper to get common props for customer pages.
     */
    private function getCommonProps()
    {
        $bankAccountsSetting = \App\Models\Setting::getValue('bank_accounts', 'accounts_json', '[]');
        $bankAccounts = json_decode($bankAccountsSetting, true) ?: [];
        $taxPercentage = \App\Models\Setting::getValue('pos_settings', 'tax_percentage', '11');

        return [
            'bankAccounts' => $bankAccounts,
            'taxPercentage' => (float) $taxPercentage,
        ];
    }

    /**
     * Display table selection.
     */
    public function selectTable(Request $request)
    {
        if ($request->has('branch_id')) {
            session(['active_branch_id' => $request->branch_id]);
        }

        $branchId = session('active_branch_id');

        // Fallback to the first branch if no branch is in session
        if (!$branchId) {
            $branchId = \App\Models\Branch::first()?->id;
            if ($branchId) {
                session(['active_branch_id' => $branchId]);
            }
        }

        return Inertia::render('Customer/SelectTable', [
            'rooms' => \App\Models\Room::withoutGlobalScopes()
                ->with('tables')
                ->where('branch_id', $branchId)
                ->get()
        ]);
    }

    /**
     * Set active table in session via AJAX.
     */
    public function setActiveTable(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id'
        ]);

        if ($validated['table_id']) {
            $table = \App\Models\Table::withoutGlobalScopes()->find($validated['table_id']);
            session(['active_table_id' => $table->id]);
            session(['active_branch_id' => $table->branch_id]);
            
            return response()->json([
                'success' => true, 
                'table_id' => $table->id, 
                'table_name' => $table->name,
                'branch_id' => $table->branch_id
            ]);
        }

        session()->forget(['active_table_id']);
        return response()->json(['success' => true, 'table_id' => null]);
    }

    /**
     * Process checkout for customer.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            'payment_method' => 'required|string|in:Cash,QRIS,Transfer,EDC,VA',
            'payment_channel' => 'nullable|string',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'discount_code' => 'nullable|string|exists:discounts,code',
            'order_type' => 'required|string|in:dine-in,take-away,delivery',
            'table_id' => 'nullable|required_if:order_type,dine-in|exists:tables,id',
        ]);

        $tableId = $validated['order_type'] === 'dine-in' ? $validated['table_id'] : null;

        try {
            DB::beginTransaction();

            // 1. Create Initial Order Object (Draft)
            $order = app(OrderService::class)->create([
                'table_id' => $tableId,
                'customer_name' => $validated['customer_name'] ?? 'Customer Self-Order',
                'customer_phone' => $validated['customer_phone'] ?? null,
                'order_type' => $validated['order_type'],
                'order_channel' => 'SELF-ORDER',
            ]);

            // 2. Add Items
            foreach ($validated['items'] as $item) {
                app(OrderItemService::class)->addItem(
                    $order,
                    $item['id'],
                    $item['qty'],
                    $item['notes'] ?? null
                );
            }

            $order->load('items.menu');

            // 3. Find Discount if applicable
            $discount = null;
            if (!empty($validated['discount_code'])) {
                $discount = \App\Models\Discount::where('code', $validated['discount_code'])->first();
            }

            // 4. Checkout calculations to update totals (Applying Discount)
            $order = app(OrderService::class)->checkout($order, $discount);

            // 5. Process Payment
            $isQris = strtoupper($validated['payment_method']) === 'QRIS';
            $isVa = strtoupper($validated['payment_method']) === 'VA';
            $qrUrl = null;
            $paymentResponse = [];

            if ($isQris) {
                $paymentData = app(PaymentService::class)->create($order, 'QRIS');
                $qrUrl = $paymentData['qr_url'] ?? null;
                $paymentResponse = [
                    'success' => true,
                    'order_id' => $order->id,
                    'qr_url' => $qrUrl
                ];
            } elseif ($isVa) {
                $paymentData = app(PaymentService::class)->create($order, 'BANK_TRANSFER', $validated['payment_channel']);
                $paymentResponse = [
                    'success' => true,
                    'order_id' => $order->id,
                    'virtual_account' => $paymentData['virtual_account'],
                    'expired_at' => $paymentData['expired_at'],
                ];
            } else {
                // For Cash, Transfer (manual), and EDC
                $order->update(['status' => 'Pending Payment', 'payment_method' => $validated['payment_method']]);
            }

            // Shared logic: Update Table Status
            if ($tableId) {
                Table::where('id', $tableId)->update(['status' => 'occupied']);
            }

            // Shared logic: Notify
            if ($order->customer_phone) {
                try {
                    Notification::route('fonnte', $order->customer_phone)
                        ->notify(new CustomerOrderNotification($order));
                } catch (\Exception $e) {
                    \Log::error('Fonnte Notification Error: ' . $e->getMessage());
                }
            }

            // Shared logic: Broadcast to cashier POS page in real-time
            event(new \App\Events\NewSelfOrder($order));

            DB::commit();

            if (($isQris || $isVa) && $request->expectsJson()) {
                return response()->json($paymentResponse);
            }

            return redirect()->route('customer.order_status', $order->id);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => 'Gagal memproses pesanan. ' . $e->getMessage()]);
        }
    }
}
