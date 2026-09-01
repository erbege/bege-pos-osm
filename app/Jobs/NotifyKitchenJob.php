<?php

namespace App\Jobs;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifyKitchenJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation
    ) {
    }

    public function handle(): void
    {
        // Check if there are pre-ordered menus that need preparation
        if ($this->reservation->menus()->count() > 0) {
            // Forward order data to Kitchen Display System (KDS)
            // or trigger kitchen printer
            \Log::info("Job: NotifyKitchenJob executing for pre-orders of Reservation [{$this->reservation->reservation_number}]");
        }
    }
}
