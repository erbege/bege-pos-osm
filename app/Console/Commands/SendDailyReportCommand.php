<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendDailyReportCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:daily-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculates daily revenue and emails the Owner';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now()->format('Y-m-d');

        $totalRevenue = \App\Models\Order::whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->sum('total_amount');

        $owners = \App\Models\User::role('owner')->get();

        if ($owners->count() > 0) {
            \Illuminate\Support\Facades\Notification::send(
                $owners,
                new \App\Notifications\DailyReportNotification($today, $totalRevenue)
            );
            $this->info("Daily report for {$today} dispatched to {$owners->count()} owners.");
        } else {
            $this->warn("No users found with the 'owner' role to receive the report.");
        }
    }
}
