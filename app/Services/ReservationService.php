<?php

namespace App\Services;

use App\Actions\Reservation\CreateReservationAction;
use App\DTO\ReservationData;
use App\Domain\Reservation\Saga\StartReservationSaga;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function __construct(
        private CreateReservationAction $createReservationAction,
        private StartReservationSaga $startReservationSaga
    ) {
    }

    /**
     * Handle the full flow of creating a new reservation.
     */
    public function createReservation(ReservationData $data): Reservation
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the base reservation record (Draft state)
            $reservation = $this->createReservationAction->execute($data);

            // 2. Start Saga to handle payment invoice & email sending
            $this->startReservationSaga->execute($reservation);

            return $reservation;
        });
    }

    // Additional methods like cancelReservation, confirmReservation, etc.
}
