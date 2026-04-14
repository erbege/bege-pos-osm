<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\Order\OrderService;
use App\Services\Order\OrderItemService;
use App\Services\Order\OrderPaymentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Processes a single offline order received from PWA sync.
 *
 * Each offline order is processed as its own job for isolation:
 * if one order fails, others are not affected.
 *
 * Queue: sync (low priority)
 */
class SyncOfflineJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public array $orderData;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(array $orderData)
    {
        $this->orderData = $orderData;
        $this->onQueue('sync');
    }

    public function handle(): void
    {
        $data = $this->orderData;
        $uuid = $data['offline_uuid'] ?? 'unknown';

        // Idempotency check: skip if already synced
        $existing = Order::where('offline_uuid', $uuid)->first();
        if ($existing) {
            Log::info("SyncOfflineJob: skipping duplicate UUID {$uuid}");
            return;
        }

        DB::transaction(function () use ($data, $uuid) {
            // 1. Create Order
            $order = app(OrderService::class)->create([
                'table_id' => $data['table_id'] ?? null,
                'offline_uuid' => $uuid,
            ]);

            // 2. Add Items
            foreach ($data['items'] as $item) {
                app(OrderItemService::class)->addItem(
                    $order,
                    $item['id'],
                    $item['qty'],
                    $item['note'] ?? null
                );
            }

            $order->load('items.menu');

            // 3. Checkout
            $order = app(OrderService::class)->checkout($order);

            // 4. Mark as Paid (offline = always cash)
            app(OrderPaymentService::class)->markAsPaid(
                $order,
                $data['payment_method'] ?? 'cash_offline'
            );

            Log::info("SyncOfflineJob: successfully synced offline order UUID {$uuid} → Order #{$order->id}");
        });
    }

    public function failed(\Throwable $exception): void
    {
        $uuid = $this->orderData['offline_uuid'] ?? 'unknown';
        Log::error("SyncOfflineJob failed for UUID {$uuid}: {$exception->getMessage()}");
    }
}
