<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Events\ItemReady;

class KitchenController extends Controller
{
    /**
     * Display the Real-Time Kitchen Display System (KDS).
     */
    public function index(Request $request)
    {
        $station = $request->query('station', 'kitchen');

        // For the Kanban board, fetch orders that are either Paid, Preparing, or Ready.
        $orders = Order::with(['items' => function($q) use ($station) {
                $q->whereHas('menu.category', function($q) use ($station) {
                    $q->where('preparation_station', $station);
                })->with('menu.category');
            }, 'table'])
            ->whereIn('status', ['Paid', 'Preparing', 'Ready'])
            ->whereHas('items.menu.category', function($q) use ($station) {
                $q->where('preparation_station', $station);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        // Get Printer Settings from DB
        $printerSettings = Setting::where('group', 'kitchen_printer')->pluck('value', 'key');

        return Inertia::render('Kitchen/Index', [
            'initialOrders' => $orders,
            'printerSettings' => $printerSettings,
            'currentStation' => $station
        ]);
    }

    /**
     * Mark an individual order item as Ready to Serve and notify Waiters.
     */
    public function updateItemStatus(Request $request, Order $order, $itemId)
    {
        $validated = $request->validate([
            'status' => 'required|in:Preparing,Ready,Served'
        ]);

        // Eager load to avoid N+1
        $order->loadMissing(['table', 'items.menu']);

        $item = $order->items->firstWhere('id', $itemId);
        if (!$item)
            abort(404);
        $updates = ['status' => $validated['status']];
        if ($validated['status'] === 'Preparing')
            $updates['preparing_at'] = now();
        if ($validated['status'] === 'Ready')
            $updates['ready_at'] = now();
        if ($validated['status'] === 'Served')
            $updates['served_at'] = now();

        $item->update($updates);

        // If marked as Ready, fire the notification to all Waiter/Admin roles
        if ($validated['status'] === 'Ready') {
            $tableName = $order->table ? $order->table->name : 'Takeaway';

            try {
                event(new ItemReady($item->menu->name, $tableName, $order->id));
                
                $usersToNotify = \App\Models\User::role(['Admin', 'owner', 'waiter'])->get();
                \Illuminate\Support\Facades\Notification::send(
                    $usersToNotify,
                    new \App\Notifications\ItemReadyNotification($item->menu->name, $tableName)
                );
            } catch (\Throwable $e) {
                // Silently fail if broadcasting/notification fails
            }
        }

        return redirect()->back();
    }

    /**
     * Update the status of an entire order (Kitchen pipeline).
     * Allowed transitions: Paid → Preparing → Ready → Served
     */
    public function updateOrderStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:Preparing,Ready,Served'
        ]);

        // Eager load to avoid N+1 on table/items access below
        $order->loadMissing(['table', 'items.menu']);

        $allowedTransitions = [
            'Paid' => 'Preparing',
            'Preparing' => 'Ready',
            'Ready' => 'Served',
        ];

        $expected = $allowedTransitions[$order->status] ?? null;

        if ($expected !== $validated['status']) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => "Cannot transition from {$order->status} to {$validated['status']}."], 422);
            }
            return redirect()->back()->with('error', "Cannot transition from {$order->status} to {$validated['status']}.");
        }

        $order->update(['status' => $validated['status']]);

        // Update timestamps for all items in the order
        $itemUpdates = ['status' => $validated['status']];
        if ($validated['status'] === 'Preparing')
            $itemUpdates['preparing_at'] = now();
        if ($validated['status'] === 'Ready')
            $itemUpdates['ready_at'] = now();
        if ($validated['status'] === 'Served')
            $itemUpdates['served_at'] = now();

        foreach ($order->items as $item) {
            $item->update($itemUpdates);
        }

        // Broadcast the update for real-time KDS
        try {
            event(new \App\Events\OrderStatusUpdated($order->load(['items.menu', 'table'])));
        } catch (\Throwable $e) {
            // Silently fail if broadcasting is misconfigured
        }

        // If served, notify waiters
        if ($validated['status'] === 'Served' || $validated['status'] === 'Ready') {
            try {
                $usersToNotify = \App\Models\User::role(['Admin', 'owner', 'waiter'])->get();
                $tableName = $order->table ? $order->table->name : 'Takeaway';

                \Illuminate\Support\Facades\Notification::send(
                    $usersToNotify,
                    new \App\Notifications\ItemReadyNotification(
                        "Order #{$order->id}",
                        $tableName
                    )
                );
            } catch (\Throwable $e) {
                // Silently fail if notification class doesn't exist yet
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'order' => $order]);
        }

        return redirect()->back()->with('success', "Order #{$order->id} → {$validated['status']}");
    }

    /**
     * Mobile-optimized kitchen inventory management.
     */
    public function inventory()
    {
        $branchId = auth()->user()->branch_id;
        
        $materials = \App\Models\Material::where('branch_id', $branchId)
            ->where('track_inventory', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Kitchen/Inventory', [
            'materials' => $materials
        ]);
    }

    /**
     * Quick stock adjustment from kitchen.
     */
    public function updateStock(Request $request, \App\Models\Material $material)
    {
        $validated = $request->validate([
            'qty' => 'required|numeric',
            'type' => 'required|in:adjustment,waste',
            'notes' => 'nullable|string',
        ]);

        $inventory = app(\App\Services\Inventory\InventoryEngineService::class);
        $inventory->moveStock($material, $validated['qty'], $validated['type'], $validated['notes'] ?: 'Kitchen quick update');

        return back()->with('success', 'Stock updated successfully.');
    }
}
