<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Payment;
use App\Services\Accounting\AccountingService;

class RecordFinancialJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $payment;

    /**
     * Create a new job instance.
     */
    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
    }

    /**
     * Execute the job.
     */
    public function handle(AccountingService $accountingService): void
    {
        $payment = $this->payment;
        $order = $payment->order;

        if (!$order) return;

        // Prepare data for POS_ORDER_PAID template
        // template lines: total_paid, food_total, beverage_total, tax_total, service_charge_total
        
        $data = [
            'total_paid' => $payment->amount,
            'food_total' => $order->subtotal ?? 0, // Simplified for now
            'beverage_total' => 0, // Simplified for now
            'tax_total' => $order->tax_amount ?? 0,
            'service_charge_total' => $order->service_charge_amount ?? 0,
        ];

        $accountingService->generateFromEvent('POS_ORDER_PAID', $data, $order, $order->branch_id);
    }
}
