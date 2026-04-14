<?php

namespace App\Jobs;

use App\Models\Order;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Broadcasts kitchen-related events asynchronously via Laravel Reverb.
 *
 * This decouples broadcasting from the request lifecycle so that the
 * API response is fast even when Reverb or the broadcast driver is slow.
 *
 * Queue: kitchen (medium priority)
 */
class KitchenBroadcastJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;
    public string $eventType;

    public int $tries = 3;
    public int $backoff = 2;

    /**
     * @param Order  $order     The order to broadcast
     * @param string $eventType 'order.paid' | 'order.updated'
     */
    public function __construct(Order $order, string $eventType = 'order.updated')
    {
        $this->order = $order;
        $this->eventType = $eventType;
        $this->onQueue('kitchen');
    }

    public function handle(): void
    {
        $this->order->loadMissing(['items.menu', 'table']);

        match ($this->eventType) {
            'order.paid' => $this->handleOrderPaid(),
            'order.updated' => event(new OrderStatusUpdated($this->order)),
            default => Log::warning("KitchenBroadcastJob: unknown event type '{$this->eventType}'"),
        };

        Log::info("KitchenBroadcastJob: processed '{$this->eventType}' for Order #{$this->order->id}");
    }

    protected function handleOrderPaid(): void
    {
        // 1. Broadcast to KDS
        event(new OrderPaid($this->order));

        // 2. Physical Kitchen Print (Server-side)
        app(\App\Services\Order\KitchenPrinterService::class)->printOrder($this->order);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("KitchenBroadcastJob failed for Order #{$this->order->id}: {$exception->getMessage()}");
    }
}
