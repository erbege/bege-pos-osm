<?php

namespace App\Jobs;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ConfirmReservationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation
    ) {
    }

    public function handle(): void
    {
        // 1. Send confirmation email/WA to Customer
        // 2. Add to Restaurant's master schedule

        \Log::info("Job: ConfirmReservationJob executed for Reservation [{$this->reservation->reservation_number}]");
    }
}
