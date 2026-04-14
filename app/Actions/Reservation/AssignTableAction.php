<?php

namespace App\Actions\Reservation;

use App\Models\Reservation;
use App\Models\ReservationTable;
use App\Services\TableAvailabilityEngine;

class AssignTableAction
{
    public function __construct(
        private TableAvailabilityEngine $tableEngine
    ) {
    }

    /**
     * Assign specific tables directly.
     */
    public function execute(Reservation $reservation, array $tableIds): void
    {
        foreach ($tableIds as $tableId) {
            ReservationTable::create([
                'reservation_id' => $reservation->id,
                'table_id' => $tableId,
            ]);
        }
    }

    /**
     * Instruct the Smart Table Engine to find and allocate tables automatically.
     */
    public function autoAllocate(Reservation $reservation): void
    {
        $bestTables = $this->tableEngine->allocateBestTable(
            $reservation->guest_count,
            \Carbon\Carbon::parse($reservation->reservation_date)->format('Y-m-d'),
            $reservation->start_time,
            $reservation->end_time ?? \Carbon\Carbon::parse($reservation->start_time)->addHours(2)->format('H:i:s'),
            $reservation->room_id
        );

        if ($bestTables && $bestTables->isNotEmpty()) {
            $tableIds = $bestTables->pluck('id')->toArray();
            $this->execute($reservation, $tableIds);

            // Storing combinations JSON logic for advanced cases could be placed here
        } else {
            // Throw exception or mark reservation as waitlist
            throw new \DomainException("No available tables accommodate the requested capacity and time.");
        }
    }
}
