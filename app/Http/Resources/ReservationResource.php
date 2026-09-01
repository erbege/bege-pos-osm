<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_number' => $this->reservation_number,
            'status' => $this->status->value ?? $this->status,
            'payment_status' => $this->payment_status->value ?? $this->payment_status,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'guest_count' => $this->guest_count,
            'reservation_date' => $this->reservation_date,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'tables' => $this->tables->pluck('name'),
            'menus' => $this->menus,
            'dp_amount' => $this->dp_amount,
            'total_estimated_amount' => $this->total_estimated_amount,
            'expires_at' => $this->expires_at,
            'notes' => $this->notes,
        ];
    }
}
