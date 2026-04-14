<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Jobs\ExpirePendingReservationsJob;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('pos:daily-report')->dailyAt('23:59');

// Auto-generate payroll on the last day of each month at 23:59 WIB
Schedule::command('hr:generate-payroll')
    ->timezone('Asia/Jakarta')
    ->lastDayOfMonth('23:59')
    ->appendOutputTo(storage_path('logs/payroll-schedule.log'));

// Auto-expire and automate reservation states every minute
Schedule::command('reservation:automate')->everyMinute();

// Check for expired POS/OMS payments every 5 minutes
Schedule::command('payments:check-expired')->everyFiveMinutes();
