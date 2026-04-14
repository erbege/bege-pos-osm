<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;
use App\Jobs\SyncPreOrderToKitchen;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ReservationAutomationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reservation:automate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automate reservation state transitions (Preparing, Ready, No-Show)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $today = $now->toDateString();

        // 1. T-2 Hours: Confirmed -> Preparing (Kitchen Prep)
        $this->handleKitchenPrep($today, $now);

        // 2. T-1 Hour: Preparing -> Ready (Floor Setup)
        $this->handleFloorSetup($today, $now);

        // 3. No Show: Past 60 mins -> NoShow
        $this->handleNoShow($today, $now);

        // 4. Payment Expiry: Past expires_at -> Cancelled
        $this->handlePaymentExpiry($now);

        $this->info('Reservation automation checks completed.');
    }

    private function handleKitchenPrep($today, $now)
    {
        $targetTime = $now->copy()->addHours(2)->toTimeString();

        // Find confirmed reservations starting in approx 2 hours (between 110 and 130 mins)
        $reservations = Reservation::where('reservation_date', $today)
            ->where('status', ReservationStatus::Confirmed)
            ->where('start_time', '<=', $targetTime)
            ->get();

        foreach ($reservations as $res) {
            /** @var Reservation $res */
            try {
                $res->transitionTo(ReservationStatus::Preparing);
                SyncPreOrderToKitchen::dispatch($res);
                $this->info("Moved Reservation {$res->reservation_number} to Preparing (T-2 Kitchen Prep).");
            } catch (\Exception $e) {
                Log::error("Automation error (Kitchen Prep) for {$res->reservation_number}: " . $e->getMessage());
            }
        }
    }

    private function handleFloorSetup($today, $now)
    {
        $targetTime = $now->copy()->addHours(1)->toTimeString();

        // Find preparing reservations starting in approx 1 hour
        $reservations = Reservation::where('reservation_date', $today)
            ->where('status', ReservationStatus::Preparing)
            ->where('start_time', '<=', $targetTime)
            ->get();

        foreach ($reservations as $res) {
            /** @var Reservation $res */
            try {
                $res->transitionTo(ReservationStatus::Ready);
                // Notify via WA/Notif (Implementation would go here)
                $this->info("Moved Reservation {$res->reservation_number} to Ready (T-1 Floor Setup).");
            } catch (\Exception $e) {
                Log::error("Automation error (Floor Setup) for {$res->reservation_number}: " . $e->getMessage());
            }
        }
    }

    private function handleNoShow($today, $now)
    {
        $cutoffTime = $now->copy()->subMinutes(60)->toTimeString();

        // Find confirmed/preparing/ready reservations that are 60+ mins late
        $reservations = Reservation::where('reservation_date', $today)
            ->whereIn('status', [
                ReservationStatus::Confirmed,
                ReservationStatus::Preparing,
                ReservationStatus::Ready
            ])
            ->where('start_time', '<', $cutoffTime)
            ->get();

        foreach ($reservations as $res) {
            /** @var Reservation $res */
            try {
                $res->transitionTo(ReservationStatus::NoShow);
                $this->info("Marked Reservation {$res->reservation_number} as No-Show (60 mins late).");
            } catch (\Exception $e) {
                Log::error("Automation error (No-Show) for {$res->reservation_number}: " . $e->getMessage());
            }
        }
    }

    private function handlePaymentExpiry($now)
    {
        // Find pending_payment or draft reservations that have expired
        $reservations = Reservation::whereIn('status', [
            ReservationStatus::PendingPayment,
            ReservationStatus::Draft
        ])
            ->where('expires_at', '<=', $now)
            ->get();

        foreach ($reservations as $res) {
            /** @var Reservation $res */
            try {
                $res->transitionTo(ReservationStatus::Cancelled);
                $this->info("Cancelled expired Reservation {$res->reservation_number} (Payment timeout).");
            } catch (\Exception $e) {
                Log::error("Automation error (Payment Expiry) for {$res->reservation_number}: " . $e->getMessage());
            }
        }
    }
}
