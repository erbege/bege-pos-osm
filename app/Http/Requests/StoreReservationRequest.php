<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorize via policies/middleware inside the controller generally or here if granular
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'reservation_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'table_ids' => ['nullable', 'array'],
            'table_ids.*' => ['integer', 'exists:tables,id'],
            'menus' => ['nullable', 'array'],
            'menus.*.id' => ['required_with:menus', 'integer', 'exists:menus,id'],
            'menus.*.qty' => ['required_with:menus', 'integer', 'min:1'],
            'menus.*.price' => ['required_with:menus', 'numeric', 'min:0'],
            'dp_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
