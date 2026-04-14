<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;
use App\Traits\Auditable;

class StockMovement extends Model
{
    use BelongsToBranch, Auditable;

    protected $guarded = [];

    protected $casts = [
        'qty' => 'decimal:4',
        'cost' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    /**
     * Movement type constants.
     */
    const TYPE_IN = 'in';
    const TYPE_OUT = 'out';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_WASTE = 'waste';
    const TYPE_TRANSFER_IN = 'transfer_in';
    const TYPE_TRANSFER_OUT = 'transfer_out';
    const TYPE_OPNAME_ADJUSTMENT = 'opname_adjustment';

    /**
     * Reference type constants.
     */
    const REFERENCE_ORDER = 'order';
    const REFERENCE_PURCHASE = 'purchase';
    const REFERENCE_TRANSFER = 'transfer';
    const REFERENCE_OPNAME = 'opname';
    const REFERENCE_PRODUCTION = 'production';
    const REFERENCE_WASTE = 'waste';

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for incoming movements.
     */
    public function scopeIncoming($query)
    {
        return $query->whereIn('type', [self::TYPE_IN, self::TYPE_ADJUSTMENT])
            ->where('qty', '>', 0);
    }

    /**
     * Scope for outgoing movements.
     */
    public function scopeOutgoing($query)
    {
        return $query->whereIn('type', [self::TYPE_OUT, self::TYPE_WASTE, self::TYPE_ADJUSTMENT])
            ->where('qty', '<', 0);
    }

    /**
     * Scope for specific movement type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for specific material.
     */
    public function scopeForMaterial($query, int $materialId)
    {
        return $query->where('material_id', $materialId);
    }

    /**
     * Get movement value.
     */
    public function getValueAttribute(): float
    {
        return abs($this->qty * $this->cost);
    }

    /**
     * Get signed value (positive for in, negative for out).
     */
    public function getSignedValueAttribute(): float
    {
        return $this->qty * $this->cost;
    }

    /**
     * Get human-readable type label.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_IN => 'Stock In',
            self::TYPE_OUT => 'Stock Out',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            self::TYPE_WASTE => 'Waste',
            self::TYPE_TRANSFER_IN => 'Transfer In',
            self::TYPE_TRANSFER_OUT => 'Transfer Out',
            self::TYPE_OPNAME_ADJUSTMENT => 'Opname Adjustment',
            default => ucfirst($this->type),
        };
    }

    /**
     * Get type icon/color.
     */
    public function getTypeColorAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_IN => 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            self::TYPE_OUT => 'text-red-400 bg-red-500/10 border-red-500/20',
            self::TYPE_ADJUSTMENT => 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            self::TYPE_WASTE => 'text-orange-400 bg-orange-500/10 border-orange-500/20',
            self::TYPE_TRANSFER_IN => 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            self::TYPE_TRANSFER_OUT => 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            self::TYPE_OPNAME_ADJUSTMENT => 'text-pink-400 bg-pink-500/10 border-pink-500/20',
            default => 'text-white/40 bg-white/5 border-white/10',
        };
    }
}
