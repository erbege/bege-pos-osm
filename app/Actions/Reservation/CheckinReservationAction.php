<?php

namespace App\Actions\Reservation;

use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;
use Illuminate\Support\Facades\DB;

class CheckinReservationAction
{
    public function execute(Reservation $reservation, ?int $userId = null): void
    {
        DB::transaction(function () use ($reservation, $userId) {
            $reservation->transitionTo(ReservationStatus::CheckedIn, $userId);

            // Dispatch an event so that the POS system can auto-create the actual Order
            // and associate the tables to the order officially.
            event(new \App\Events\CustomerCheckedIn($reservation));
        });
    }
}
