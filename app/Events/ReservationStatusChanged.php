<?php

namespace App\Events;

use App\Domain\Reservation\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly ReservationStatus $newStatus,
        public readonly ReservationStatus $oldStatus
    ) {
    }
}
