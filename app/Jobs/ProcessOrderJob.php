<?php

namespace App\Jobs;

use App\Models\Order;
use App\Events\OrderPaid;
use App\Services\Order\OrderInventoryService;
use App\Services\Order\OrderFinanceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Processes an order after payment succeeds.
 *
 * Dispatched from OrderPaymentService::markAsPaid()
 * Handles: stock deduction, financial recording, and kitchen broadcast.
 *
 * Queue: orders (high priority)
 */
class ProcessOrderJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(Order $order)
    {
        $this->order = $order;
        $this->onQueue('orders');
    }

    public function handle(): void
    {
        $this->order->loadMissing(['items.menu.recipes', 'table']);

        // 1. Deduct Inventory (via dedicated job on inventory queue)
        DeductStockJob::dispatch($this->order)->onQueue('inventory');

        // 2. Record Financial Transaction
        $payment = $this->order->payments()->latest()->first();
        if ($payment) {
            RecordFinancialJob::dispatch($payment)->onQueue('finance');
        }

        // 3. Broadcast to Kitchen via dedicated job
        KitchenBroadcastJob::dispatch($this->order, 'order.paid')->onQueue('kitchen');

        Log::info("ProcessOrderJob completed for Order #{$this->order->id}");
    }

    /**
     * Handle job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessOrderJob failed for Order #{$this->order->id}: {$exception->getMessage()}");
    }
}
