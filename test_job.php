<?php

// test_job.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Grab a payment to simulate
$payment = \App\Models\Payment::first();

if (!$payment) {
    echo "No payments found to simulate!\n";
    exit;
}

echo "Dispatching RecordFinancialJob for Payment ID: " . $payment->id . "\n";

\App\Jobs\RecordFinancialJob::dispatch($payment);

echo "Job originally dispatched to Queue system successfully!\n";
