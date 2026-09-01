<?php

namespace App\Jobs;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ReleaseReservedTableJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation
    ) {
    }

    public function handle(): void
    {
        // Since state is Cancelled/Rejected, table allocation engine 
        // won't consider the table occupied anymore based on SQL query.
        // But if tables were locked explicitly or if we need to clean up `reservation_tables`:

        // Uncomment if strategy requires physical unbinding
        // $this->reservation->tables()->delete();

        \Log::info("Job: ReleaseReservedTableJob executed for Reservation [{$this->reservation->reservation_number}]");
    }
}
