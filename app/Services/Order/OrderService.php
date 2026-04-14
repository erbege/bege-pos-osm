<?php

namespace App\Services\Order;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * Create a new draft order (Not used in direct POS checkout yet, but needed for future flexibility).
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            return Order::create([
                'table_id' => $data['table_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'reservation_id' => $data['reservation_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? (auth()->user()?->branch_id),
                'status' => $data['status'] ?? 'Draft',
                'user_id' => auth()->id(),
                'total_amount' => $data['total_amount'] ?? 0,
                'tax_amount' => $data['tax_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'discount_id' => $data['discount_id'] ?? null,
                'order_channel' => $data['order_channel'] ?? 'POS',
                'order_type' => $data['order_type'] ?? 'DINE_IN',
                'payment_status' => $data['payment_status'] ?? 'UNPAID',
                'fulfillment_status' => $data['fulfillment_status'] ?? 'PENDING',
                'delivery_address' => $data['delivery_address'] ?? null,
                'delivery_fee' => $data['delivery_fee'] ?? 0,
                'driver_name' => $data['driver_name'] ?? null,
                'delivery_notes' => $data['delivery_notes'] ?? null,
            ]);
        });
    }

    /**
     * Finalize checkout: Calculate totals, apply discounts, and update order status.
     *
     * @param  Discount|float|int|null  $discount  Can be a Discount model or a manual amount (numeric)
     */
    public function checkout(Order $order, $discount = null): Order
    {
        return DB::transaction(function () use ($order, $discount) {
            $subtotal = $order->items->sum(function ($item) {
                return $item->price * $item->qty;
            });

            $discountAmount = 0;
            $discountId = null;

            if ($discount instanceof \App\Models\Discount) {
                if ($discount->isValidForAmount($subtotal)) {
                    $discountAmount = $discount->calculateDiscount($subtotal);
                    $discountId = $discount->id;
                    $discount->increment('used_count');
                }
            } elseif (is_numeric($discount)) {
                $discountAmount = min($discount, $subtotal);
            }

            // DP Deduction
            $dpAmount = 0;
            if ($order->reservation) {
                $dpAmount = (float) $order->reservation->dp_amount;
            }

            // Tax Calculation
            $taxPercentage = (float) \App\Models\Setting::getValue('pos_settings', 'tax_percentage', '0');
            $afterDiscount = $subtotal - $discountAmount;
            $taxAmount = round($afterDiscount * ($taxPercentage / 100));

            $order->update([
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'discount_id' => $discountId,
                'tax_amount' => $taxAmount,
                'dp_amount_deducted' => $dpAmount,
                'total_amount' => max(0, round(($afterDiscount + $taxAmount) - $dpAmount)),
                'status' => 'Pending Payment',
            ]);

            return $order;
        });
    }

    /**
     * Cancel an order and release resources.
     */
    public function cancel(Order $order, string $reason): Order
    {
        return DB::transaction(function () use ($order, $reason) {
            $order->update([
                'status' => 'Cancelled',
                'payment_status' => 'CANCELLED',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);

            // Release stock reservations
            app(\App\Services\Inventory\InventoryEngineService::class)->releaseStock($order);

            // Free the table if it was occupied
            if ($order->table_id) {
                $otherOrders = Order::where('table_id', $order->table_id)
                    ->where('id', '!=', $order->id)
                    ->whereIn('status', ['Draft', 'Pending Payment', 'Paid', 'Preparing', 'Ready'])
                    ->exists();

                if (!$otherOrders) {
                    \App\Models\Table::where('id', $order->table_id)->update(['status' => 'available']);
                    event(new \App\Events\TableStatusUpdated($order->table));
                }
            }

            // Broadcast status update
            event(new \App\Events\OrderStatusUpdated($order));

            return $order;
        });
    }
}
