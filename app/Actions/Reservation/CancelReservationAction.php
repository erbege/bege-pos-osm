<?php

namespace App\Actions\Reservation;

use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;

class CancelReservationAction
{
    public function execute(Reservation $reservation, ?int $userId = null): void
    {
        $reservation->transitionTo(ReservationStatus::Cancelled, $userId);

        // Here we could also add logic to process refunds or dispatch refund jobs
        // based on the ReservationPolicy logic.
    }
}
