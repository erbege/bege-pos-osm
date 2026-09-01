<?php

namespace App\Services;

use App\Models\Table;
use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TableAvailabilityEngine
{
    /**
     * Check if a specific time range overlaps with any existing reservations for a table.
     */
    public function calculateOverlap(Table $table, string $date, string $startTime, string $endTime): bool
    {
        return $table->reservations()
            ->where('reservation_date', $date)
            ->whereIn('status', [
                ReservationStatus::PendingPayment,
                ReservationStatus::Confirmed,
                ReservationStatus::Preparing,
                ReservationStatus::Ready,
                ReservationStatus::CheckedIn
            ])
            ->where(function ($query) use ($startTime, $endTime) {
                // Check if requested time falls within an existing reservation
                // NOT (end_time <= requested_start OR start_time >= requested_end)
                // Which translates to: requested_start < existing_end AND requested_end > existing_start
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })->exists();
    }

    /**
     * Get recommended duration based on party size as per 22A spec.
     */
    public function getDurationByGuestCount(int $guestCount): int
    {
        if ($guestCount <= 2)
            return 90;
        if ($guestCount <= 5)
            return 120;
        return 150;
    }

    /**
     * Get all available tables for a specific time and area.
     */
    public function getAvailableTables(string $date, string $start, string $end, ?int $roomId = null, bool $onlyCombinable = false): Collection
    {
        $query = Table::query();

        if ($roomId) {
            $query->where('room_id', $roomId);
        }

        if ($onlyCombinable) {
            $query->where('is_combinable', true);
        }

        return $query->whereDoesntHave('reservations', function ($q) use ($date, $start, $end) {
            $q->where('reservations.reservation_date', $date)
                ->whereIn('reservations.status', [
                    ReservationStatus::PendingPayment,
                    ReservationStatus::Confirmed,
                    ReservationStatus::Preparing,
                    ReservationStatus::Ready,
                    ReservationStatus::CheckedIn
                ])
                ->where(function ($timeQ) use ($start, $end) {
                    $timeQ->where('reservations.start_time', '<', $end)
                        ->where('reservations.end_time', '>', $start);
                });
        })->get();
    }

    /**
     * Smart allocate best table or combination of tables.
     */
    public function allocateBestTable(int $partySize, string $date, string $start, ?string $end = null, ?int $roomId = null): ?Collection
    {
        if (!$end) {
            $duration = $this->getDurationByGuestCount($partySize);
            $end = Carbon::parse($start)->addMinutes($duration)->format('H:i:s');
        }

        $availableTables = $this->getAvailableTables($date, $start, $end, $roomId);

        if ($availableTables->isEmpty()) {
            return null;
        }

        // Try to find a single table first
        $singleTable = $availableTables
            ->where('capacity', '>=', $partySize)
            ->sortBy('capacity')
            ->first();

        if ($singleTable) {
            return collect([$singleTable]);
        }

        // If no single table fits, try combinations
        $combinableTables = $availableTables->where('is_combinable', true);

        return $this->findAllCombinations($combinableTables, $partySize)->first();
    }

    /**
     * Specialized for Frontend: returns a list of suggested options (Single or Combos)
     */
    public function getSuggestedOptions(int $partySize, string $date, string $start, ?string $end = null, ?int $roomId = null): Collection
    {
        if (!$end) {
            $duration = $this->getDurationByGuestCount($partySize);
            $end = Carbon::parse($start)->addMinutes($duration)->format('H:i:s');
        }

        $availableTables = $this->getAvailableTables($date, $start, $end, $roomId);
        $options = collect();

        // 1. Find all suitable single tables
        $singles = $availableTables->where('capacity', '>=', $partySize)
            ->sortBy('capacity')
            ->take(3); // Top 3 best fits

        foreach ($singles as $table) {
            $options->push([
                'type' => 'single',
                'tables' => [$table],
                'total_capacity' => $table->capacity,
                'name' => $table->name
            ]);
        }

        // 2. Find best combinations
        $combos = $this->findAllCombinations($availableTables->where('is_combinable', true), $partySize);

        foreach ($combos as $combo) {
            $options->push([
                'type' => 'combination',
                'tables' => $combo,
                'total_capacity' => $combo->sum('capacity'),
                'name' => 'Combined Tables: ' . $combo->pluck('name')->join(' + ')
            ]);
        }

        return $options->values();
    }

    /**
     * Find multiple best combinations across different adjacency groups.
     */
    private function findAllCombinations(Collection $tables, int $targetCapacity): Collection
    {
        $allBestCombos = collect();
        $bestWasteAcrossGroups = PHP_INT_MAX;

        // Group tables by Branch, Room, and combination_group. 
        // We MUST NOT combine tables across different branches or different rooms.
        $groups = $tables->groupBy(function ($t) {
            $branchId = $t->branch_id ?? 'default';
            $roomId = $t->room_id ?? 'unassigned';
            $group = empty($t->combination_group) ? 'general' : $t->combination_group;

            return "B{$branchId}-R{$roomId}-G{$group}";
        });

        foreach ($groups as $groupId => $groupTables) {
            $groupTables = $groupTables->values();
            $n = $groupTables->count();

            $maxN = min($n, 15);
            $bestGroupCombo = null;
            $bestGroupWaste = PHP_INT_MAX;

            for ($i = 1; $i < (1 << $maxN); $i++) {
                $currentCombo = collect();
                $currentCapacity = 0;

                $bits = 0;
                $tempI = $i;
                while ($tempI > 0) {
                    $tempI &= ($tempI - 1);
                    $bits++;
                }
                if ($bits > 4)
                    continue;

                for ($j = 0; $j < $n; $j++) {
                    if (($i & (1 << $j)) > 0) {
                        $table = $groupTables[$j];
                        $currentCombo->push($table);
                        $currentCapacity += $table->capacity;
                    }
                }

                if ($currentCapacity >= $targetCapacity) {
                    $waste = $currentCapacity - $targetCapacity;

                    if ($waste < $bestGroupWaste) {
                        $bestGroupWaste = $waste;
                        $bestGroupCombo = $currentCombo;
                    } elseif ($waste === $bestGroupWaste) {
                        if ($bestGroupCombo && $currentCombo->count() < $bestGroupCombo->count()) {
                            $bestGroupCombo = $currentCombo;
                        }
                    }
                }
            }

            if ($bestGroupCombo) {
                // If this is a very good fit, track it
                if ($bestGroupWaste <= $bestWasteAcrossGroups + 2) {
                    $allBestCombos->push($bestGroupCombo);
                    if ($bestGroupWaste < $bestWasteAcrossGroups) {
                        $bestWasteAcrossGroups = $bestGroupWaste;
                    }
                }
            }
        }

        // Sort by waste and then number of tables
        return $allBestCombos->sortBy(function ($combo) use ($targetCapacity) {
            $waste = $combo->sum('capacity') - $targetCapacity;
            return $waste * 100 + $combo->count();
        })->take(3); // Suggest top 3 different configurations
    }
}
