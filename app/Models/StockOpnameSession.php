<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;
use App\Traits\Auditable;

class StockOpnameSession extends Model
{
    use BelongsToBranch, Auditable;

    protected $guarded = [];

    protected $appends = ['total_variance_value'];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'approved_at' => 'datetime',
        'submitted_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'blind_count' => 'boolean',
    ];

    /**
     * Status constants.
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_COUNTING = 'counting';
    const STATUS_REVIEW = 'review';
    const STATUS_APPROVED = 'approved';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Scope constants.
     */
    const SCOPE_ALL = 'all';
    const SCOPE_CATEGORY = 'category';
    const SCOPE_WAREHOUSE = 'warehouse';
    const SCOPE_SPECIFIC = 'specific';

    public function items()
    {
        return $this->hasMany(StockOpnameItem::class, 'session_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function canceller()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Scope for sessions that can still be edited.
     */
    public function scopeEditable($query)
    {
        return $query->whereIn('status', [self::STATUS_DRAFT, self::STATUS_COUNTING]);
    }

    /**
     * Scope for sessions pending approval.
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', self::STATUS_REVIEW);
    }

    /**
     * Get completion percentage.
     */
    public function getCompletionPercentageAttribute(): float
    {
        $total = $this->items()->count();
        if ($total === 0) {
            return 0;
        }

        $counted = $this->items()->whereNotNull('counted_qty')->count();
        return round(($counted / $total) * 100, 2);
    }

    /**
     * Check if session is editable.
     */
    public function isEditable(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_COUNTING]);
    }

    /**
     * Check if session needs approval.
     */
    public function needsApproval(): bool
    {
        return $this->status === self::STATUS_REVIEW;
    }

    /**
     * Get items with variance.
     */
    public function getVarianceItemsAttribute()
    {
        return $this->items()->whereNotNull('variance')
            ->where('variance', '!=', 0)
            ->get();
    }

    /**
     * Get total variance value.
     */
    public function getTotalVarianceValueAttribute(): float
    {
        $total = 0;
        foreach ($this->items as $item) {
            if ($item->variance) {
                $total += $item->variance * $item->material->avg_cost;
            }
        }
        return $total;
    }
}
