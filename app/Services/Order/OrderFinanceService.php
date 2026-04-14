<?php

namespace App\Services\Order;

use App\Models\Payment;
use App\Models\Transaction;

class OrderFinanceService
{
    public function recordIncome(Payment $payment)
    {
        // Log to transactions table for finance asynchronously
        \App\Jobs\RecordFinancialJob::dispatch($payment);
    }
}
