<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class ApproveStockOpnameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole(['Admin', 'owner']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'variance_threshold' => ['nullable', 'numeric', 'min:0', 'max:100'], // Percentage
            'force_approve' => ['nullable', 'boolean'], // Override threshold
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'variance_threshold.numeric' => 'Variance threshold must be a number',
            'variance_threshold.min' => 'Variance threshold cannot be negative',
            'variance_threshold.max' => 'Variance threshold cannot exceed 100%',
        ];
    }
}
