<?php

namespace App\States\Order;

use App\Models\Order;

class OrderStateResolver
{
    public static function resolve(Order $order): OrderState
    {
        return match ($order->status) {
            'Draft' => new DraftState($order),
            'Pending Payment' => new PendingPaymentState($order),
            'Paid' => new PaidState($order),
            'Preparing' => new PreparingState($order),
            'Ready' => new ReadyState($order),
            'Served' => new ServedState($order),
            'Completed' => new CompletedState($order),
            'Cancelled' => new CancelledState($order),
            default => new DraftState($order), // Fallback
        };
    }
}
