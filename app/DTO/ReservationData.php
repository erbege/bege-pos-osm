<?php

namespace App\DTO;

use Illuminate\Http\Request;

class ReservationData
{
    public function __construct(
        public readonly int $branchId,
        public readonly string $customerName,
        public readonly string $customerPhone,
        public readonly int $guestCount,
        public readonly string $reservationDate,
        public readonly string $startTime,
        public readonly ?string $endTime = null,
        public readonly ?int $roomId = null,
        public readonly ?int $customerId = null,
        public readonly ?array $tableIds = null,
        public readonly ?array $menus = null,
        public readonly float $dpAmount = 0.0,
        public readonly ?string $notes = null,
        public readonly ?int $createdBy = null
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        return new self(
            branchId: $request->input('branch_id'),
            customerName: $request->input('customer_name'),
            customerPhone: $request->input('customer_phone'),
            guestCount: $request->input('guest_count'),
            reservationDate: $request->input('reservation_date'),
            startTime: $request->input('start_time'),
            endTime: $request->input('end_time'),
            roomId: $request->input('room_id'),
            customerId: $request->input('customer_id'),
            tableIds: $request->input('table_ids'),
            menus: $request->input('menus'),
            dpAmount: (float) $request->input('dp_amount', 0),
            notes: $request->input('notes'),
            createdBy: $request->user()?->id ?? 1 // Fallback for testing
        );
    }
}
