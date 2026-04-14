<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a customer self-order is placed.
 * The cashier POS page listens on the 'cashier' channel for this event.
 */
class NewSelfOrder implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['items.menu', 'table']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('cashier'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'new.self.order';
    }
}
