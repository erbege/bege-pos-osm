<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Setting;
use App\Services\Order\OrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CleanupExpiredOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $qrisTimeout = (int) Setting::getValue('pos_settings', 'qris_timeout_minutes', '15');
        $bankTimeout = (int) Setting::getValue('pos_settings', 'bank_transfer_timeout_minutes', '60');
        $defaultTimeout = 30;

        $pendingOrders = Order::where('status', 'Pending Payment')->get();

        foreach ($pendingOrders as $order) {
            $timeout = $defaultTimeout;
            
            if ($order->payment_method === 'QRIS') {
                $timeout = $qrisTimeout;
            } elseif ($order->payment_method === 'Transfer') {
                $timeout = $bankTimeout;
            }

            if ($order->created_at->addMinutes($timeout)->isPast()) {
                Log::info("Auto-cancelling Order #{$order->id} due to payment timeout ({$timeout} min).");
                app(OrderService::class)->cancel($order, 'Automatic: Payment Timeout');
            }
        }
    }
}
