<?php

namespace App\Jobs;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ScheduleReservationExpiration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation
    ) {
    }

    public function handle(): void
    {
        // 1. Calculate when it should expire (e.g. 15 minutes from now)
        $expiresAt = now()->addMinutes(15);

        $this->reservation->update(['expires_at' => $expiresAt]);

        // 2. Dispatch a delayed job exactly at that time
        ExpireReservationJob::dispatch($this->reservation)
            ->delay($expiresAt);
    }
}
