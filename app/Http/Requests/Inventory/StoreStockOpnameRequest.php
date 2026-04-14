<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockOpnameRequest extends FormRequest
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
            'scope' => ['nullable', 'string', 'in:all,category,warehouse,specific'],
            'category_ids' => ['nullable', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'material_ids' => ['nullable', 'array', 'min:1'],
            'material_ids.*' => ['integer', 'exists:materials,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'blind_count' => ['nullable', 'boolean'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
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
            'scope.in' => 'Scope must be one of: all, category, warehouse, specific',
            'category_ids.min' => 'Please select at least one category',
            'material_ids.min' => 'Please select at least one material',
            'scheduled_at.after_or_equal' => 'Scheduled time must be in the future',
        ];
    }
}
