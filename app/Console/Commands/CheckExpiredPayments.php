<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class CheckExpiredPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expired pending payments and update their status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiredPayments = Payment::where('status', 'pending')
            ->whereNotNull('expired_at')
            ->where('expired_at', '<', now())
            ->get();

        if ($expiredPayments->isEmpty()) {
            return;
        }

        foreach ($expiredPayments as $payment) {
            $payment->update(['status' => 'expired']);
            
            if ($payment->order && $payment->order->status === 'Pending Payment') {
                $payment->order->update(['status' => 'Cancelled']);
                Log::info("Order #{$payment->order_id} cancelled due to payment expiration.");
            }
        }

        $this->info("Processed " . $expiredPayments->count() . " expired payments.");
    }
}
