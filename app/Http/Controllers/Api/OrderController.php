<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Order\OrderService;
use App\Services\Order\OrderItemService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Store a newly created order from an external channel (Online, Marketplace, App).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_channel' => 'required|string|in:POS,TABLE,ONLINE,MARKETPLACE,DELIVERY',
            'order_type' => 'required|string|in:DINE_IN,TAKEAWAY,DELIVERY',
            'customer_name' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'delivery_address' => 'nullable|string|required_if:order_type,DELIVERY',
            'delivery_fee' => 'nullable|numeric|min:0',
            'delivery_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'items.*.modifier_ids' => 'nullable|array',
            'items.*.modifier_ids.*' => 'exists:modifiers,id',
            'branch_id' => 'required|exists:branches,id',
            'discount_code' => 'nullable|string',
            'manual_discount_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Resolve the Discount object or manual amount
            $discount = null;
            if (!empty($validated['discount_code'])) {
                $discount = \App\Models\Discount::where('code', $validated['discount_code'])->first();
            }
            if (!$discount && !empty($validated['manual_discount_amount'])) {
                $discount = $validated['manual_discount_amount'];
            }

            // Create Order Object
            $order = app(OrderService::class)->create([
                'branch_id' => $validated['branch_id'],
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'order_channel' => $validated['order_channel'],
                'order_type' => $validated['order_type'],
                'delivery_address' => $validated['delivery_address'] ?? null,
                'delivery_fee' => $validated['delivery_fee'] ?? 0,
                'delivery_notes' => $validated['delivery_notes'] ?? null,
                'status' => 'Pending Payment', // Online orders usually start pending payment
            ]);

            // Add Items securely
            foreach ($validated['items'] as $item) {
                app(OrderItemService::class)->addItem(
                    $order,
                    $item['id'],
                    $item['qty'],
                    $item['notes'] ?? null,
                    $item['modifier_ids'] ?? []
                );
            }

            // Dispatch OrderCreated for inventory reservation
            event(new \App\Events\OrderCreated($order));

            // Reload relationships
            $order->load(['items.menu']);

            // Checkout calculations to update totals
            $order = app(OrderService::class)->checkout($order, $discount);

            // Add delivery fee to total amount if applicable
            if ($order->order_type === 'DELIVERY' && $order->delivery_fee > 0) {
                $order->update([
                    'total_amount' => $order->total_amount + $order->delivery_fee
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully.',
                'order' => $order->load('items.menu')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order)
    {
        return response()->json([
            'success' => true,
            'order' => $order->load(['items.menu', 'table', 'reservation'])
        ]);
    }

    /**
     * Get real-time status of the order.
     */
    public function status(Order $order)
    {
        return response()->json([
            'success' => true,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'fulfillment_status' => $order->fulfillment_status
        ]);
    }
}
