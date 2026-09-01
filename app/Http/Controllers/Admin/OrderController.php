<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Events\OrderStatusUpdated;
use App\Services\Order\OrderPaymentService;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['items.menu', 'table', 'user.roles', 'reservation', 'discount'])
            ->latest();

        if ($request->status && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->order_channel && $request->order_channel !== 'All') {
            $query->where('order_channel', $request->order_channel);
        }

        if ($request->order_type && $request->order_type !== 'All') {
            $query->where('order_type', $request->order_type);
        }

        if ($request->search) {
            $query->where('id', 'like', "%{$request->search}%");
        }

        $orders = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Orders', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'search', 'order_channel', 'order_type']),
            'statuses' => ['Draft', 'Pending Payment', 'Paid', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'],
            'channels' => ['All', 'POS', 'TABLE', 'ONLINE', 'MARKETPLACE', 'DELIVERY'],
            'types' => ['All', 'DINE_IN', 'TAKEAWAY', 'DELIVERY']
        ]);
    }

    public function confirmPayment(Order $order)
    {
        if ($order->status !== 'Pending Payment') {
            return back()->withErrors(['error' => 'Hanya pesanan dengan status Pending Payment yang bisa dikonfirmasi.']);
        }

        app(OrderPaymentService::class)->markAsPaid($order, 'Cash');

        return back()->with('success', "Pembayaran untuk Order #{$order->id} telah dikonfirmasi.");
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Draft,Pending Payment,Paid,Preparing,Ready,Served,Completed,Cancelled'
        ]);

        $order->update(['status' => $validated['status']]);

        // Broadcast for KDS and other listeners
        event(new OrderStatusUpdated($order));

        return back()->with('success', "Order #{$order->id} status updated to {$validated['status']}.");
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:orders,id',
            'status' => 'required|string|in:Preparing,Ready,Served,Completed,Cancelled'
        ]);

        $ids = $validated['ids'];
        $newStatus = $validated['status'];

        // 1. Database update in one go (Fast)
        Order::whereIn('id', $ids)->update(['status' => $newStatus]);

        // 2. Dispatch events in background after response is sent
        dispatch(function () use ($ids) {
            $orders = Order::whereIn('id', $ids)->get();
            foreach ($orders as $order) {
                event(new OrderStatusUpdated($order));
            }
        })->afterResponse();

        return back()->with('success', count($ids) . " orders status updated to {$newStatus}.");
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:orders,id',
        ]);

        $ids = $validated['ids'];

        // Mass delete is already efficient
        Order::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . " orders deleted successfully.");
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return back()->with('success', 'Order deleted successfully.');
    }
}
