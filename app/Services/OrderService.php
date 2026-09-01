<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * Create a new order with multiple items.
     *
     * @param array $data
     * @return Order
     * @throws \Exception
     */
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'user_id' => $data['user_id'] ?? null,
                'table_id' => $data['table_id'] ?? null,
                'reservation_id' => $data['reservation_id'] ?? null,
                'total_amount' => 0,
                'status' => $data['status'] ?? 'Pending Payment',
                'payment_method' => $data['payment_method'] ?? null,
            ]);

            $total = 0;

            foreach ($data['items'] as $item) {
                $subtotal = $item['price'] * $item['qty'];
                $total += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id' => $item['menu_id'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'subtotal' => $subtotal,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $order->update(['total_amount' => $total]);

            // If a payment gateway sequence is required, emit an event or return it here
            return $order;
        });
    }

    /**
     * Update order status
     *
     * @param Order $order
     * @param string $status
     * @return Order
     */
    public function updateStatus(Order $order, string $status): Order
    {
        $order->update(['status' => $status]);

        // Emitting broadcast event
        // broadcast(new OrderStatusUpdated($order));

        return $order;
    }
}
