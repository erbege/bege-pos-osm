<?php

namespace App\Actions\Reservation;

use App\DTO\ReservationData;
use App\Models\Reservation;
use App\Domain\Reservation\Enums\ReservationStatus;

class CreateReservationAction
{
    public function __construct(
        private GenerateReservationCodeAction $generateCodeAction,
        private AssignTableAction $assignTableAction
    ) {
    }

    public function execute(ReservationData $data): Reservation
    {
        // 1. Generate unique reservation number
        $reservationNumber = $this->generateCodeAction->execute($data->branchId, $data->reservationDate);

        // 2. Create the Reservation record (Draft initially)
        $reservation = Reservation::create([
            'reservation_number' => $reservationNumber,
            'branch_id' => $data->branchId,
            'customer_name' => $data->customerName,
            'customer_phone' => $data->customerPhone,
            'guest_count' => $data->guestCount,
            'reservation_date' => $data->reservationDate,
            'start_time' => $data->startTime,
            'end_time' => $data->endTime,
            'room_id' => $data->roomId,
            'status' => ReservationStatus::Draft,
            'dp_amount' => $data->dpAmount,
            'notes' => $data->notes,
            'created_by' => $data->createdBy,
        ]);

        // 3. Assign tables (Soft allocate if using Smart Allocation)
        if ($data->tableIds) {
            // Direct assigned
            $this->assignTableAction->execute($reservation, $data->tableIds);
        } else {
            // Auto allocate from engine
            $this->assignTableAction->autoAllocate($reservation);
        }

        // 4. Attach menus if any (Pre-order logic)
        if ($data->menus) {
            foreach ($data->menus as $menu) {
                // Assuming format: ['id' => 1, 'qty' => 2, 'price' => 50000]
                $reservation->menus()->create([
                    'menu_id' => $menu['id'],
                    'quantity' => $menu['qty'],
                    'price_snapshot' => $menu['price'],
                ]);
            }

            // Recalculate estimated total
            $estimatedTotal = collect($data->menus)->sum(fn($m) => $m['qty'] * $m['price']);
            $reservation->update(['total_estimated_amount' => $estimatedTotal]);
        }

        // 5. Shift state to PendingPayment (since we start Saga after this)
        $reservation->transitionTo(ReservationStatus::PendingPayment);

        return $reservation;
    }
}
