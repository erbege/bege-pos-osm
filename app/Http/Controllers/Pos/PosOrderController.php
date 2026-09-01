<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Order\OrderPaymentService;
use App\Services\Order\OrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;

class PosOrderController extends Controller
{
    /**
     * Display a print-friendly thermal receipt for an order.
     */
    public function printThermal(Order $order)
    {
        $order->load(['items.menu', 'table', 'user', 'discount']);
        
        $posSettings = Setting::whereIn('group', ['pos_settings', 'business_info'])->get()->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->value];
        });

        return Inertia::render('POS/PrintReceipt', [
            'order' => $order,
            'posSettings' => $posSettings
        ]);
    }

    /**
     * Return JSON list of Pending Payment orders for the POS cashier panel.
     */
    public function pendingOrders()
    {
        $orders = Order::with(['items.menu', 'table'])
            ->where('status', 'Pending Payment')
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Confirm cash payment from POS page (same logic as admin).
     */
    public function confirmPayment(Order $order)
    {
        if ($order->status !== 'Pending Payment') {
            return back()->withErrors(['error' => 'Hanya pesanan dengan status Pending Payment yang bisa dikonfirmasi.']);
        }

        app(OrderPaymentService::class)->markAsPaid($order, 'Cash');

        return back()->with('success', "Pembayaran Order #{$order->id} dikonfirmasi.");
    }

    /**
     * Cancel an order from POS page.
     */
    public function cancel(Request $request, Order $order)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        app(OrderService::class)->cancel($order, $validated['reason']);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => "Order #{$order->id} berhasil dibatalkan."]);
        }

        return back()->with('success', "Order #{$order->id} berhasil dibatalkan.");
    }
}
