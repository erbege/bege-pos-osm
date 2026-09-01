<?php

namespace App\States\Order;

use App\Models\Order;
use App\Jobs\KitchenBroadcastJob;
use Exception;

abstract class OrderState
{
    protected Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function transitionTo(string $state)
    {
        if (!in_array($state, $this->allowedTransitions())) {
            throw new Exception("Invalid state transition from {$this->order->status} to {$state}");
        }

        $this->order->update([
            'status' => $state
        ]);

        // Broadcast status change asynchronously via kitchen queue
        KitchenBroadcastJob::dispatch($this->order, 'order.updated');
    }

    abstract protected function allowedTransitions(): array;
}
