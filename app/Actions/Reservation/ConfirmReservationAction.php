<?php

namespace App\Actions\Reservation;

use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;

class ConfirmReservationAction
{
    public function execute(Reservation $reservation, ?int $userId = null): void
    {
        // Simply transition using the State Machine.
        // Inside the State Machine, validation for DP Payment triggers.
        $reservation->transitionTo(ReservationStatus::Confirmed, $userId);
    }
}
