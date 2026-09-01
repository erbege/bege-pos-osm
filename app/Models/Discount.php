<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

class Discount extends Model
{
    use BelongsToBranch;
    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'min_purchase_amount',
        'payment_method',
        'bank_name',
        'usage_limit',
        'used_count',
        'is_active',
        'is_automatic',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_automatic' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
    ];

    /**
     * Check if the discount is currently valid and applicable to the given amount
     */
    public function isValidForAmount($amount): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Check usage limit
        if ($this->usage_limit > 0 && $this->used_count >= $this->usage_limit) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->valid_from && $this->valid_from->gt($today)) {
            return false;
        }

        if ($this->valid_until && $this->valid_until->lt($today)) {
            return false;
        }

        if ($amount < $this->min_purchase_amount) {
            return false;
        }

        return true;
    }

    /**
     * Calculate the discount amount based on type
     */
    public function calculateDiscount($subtotal)
    {
        if ($this->type === 'percentage') {
            return ($subtotal * $this->value) / 100;
        }

        // Fixed amount discount cannot exceed subtotal
        return min($subtotal, $this->value);
    }
}
