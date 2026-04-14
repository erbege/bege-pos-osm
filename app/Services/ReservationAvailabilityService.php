<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Table;
use App\Models\Room;
use App\Domain\Reservation\Enums\ReservationStatus;
use Carbon\Carbon;

class ReservationAvailabilityService
{
    /**
     * Check if a list of tables and/or a room is available for a given time slot.
     */
    public function checkAvailability(
        int $branchId,
        string $date,
        string $startTime,
        string $endTime,
        array $tableIds = [],
        ?int $roomId = null,
        ?int $excludeReservationId = null
    ): bool {
        $start = Carbon::parse("$date $startTime");
        $end = Carbon::parse("$date $endTime");

        // Statuses that block availability
        $blockingStatuses = [
            ReservationStatus::Draft->value,
            ReservationStatus::PendingPayment->value,
            ReservationStatus::Confirmed->value,
            ReservationStatus::Preparing->value,
            ReservationStatus::Ready->value,
            ReservationStatus::CheckedIn->value,
        ];

        $query = Reservation::where('branch_id', $branchId)
            ->where('reservation_date', $date)
            ->whereIn('status', $blockingStatuses)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($q2) use ($startTime, $endTime) {
                    $q2->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        $conflictingReservations = $query->get();

        // 1. Check Room Conflict
        if ($roomId) {
            /** @var Reservation $res */
            foreach ($conflictingReservations as $res) {
                if ($res->room_id === $roomId) {
                    return false;
                }
            }
        }

        // 2. Check Table Conflicts
        if (!empty($tableIds)) {
            /** @var Reservation $res */
            foreach ($conflictingReservations as $res) {
                $resTableIds = $res->tables()->pluck('tables.id')->toArray();
                if (!empty(array_intersect($tableIds, $resTableIds))) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get all available tables for a specific time.
     */
    public function getAvailableTables(int $branchId, string $date, string $startTime, string $endTime)
    {
        $allTables = Table::where('branch_id', $branchId)->get();
        $availableTables = [];

        foreach ($allTables as $table) {
            if ($this->checkAvailability($branchId, $date, $startTime, $endTime, [$table->id])) {
                $availableTables[] = $table;
            }
        }

        return collect($availableTables);
    }
}
