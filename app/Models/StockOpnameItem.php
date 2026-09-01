<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class StockOpnameItem extends Model
{
    use Auditable;

    protected $guarded = [];

    protected $casts = [
        'system_qty' => 'decimal:4',
        'counted_qty' => 'decimal:4',
        'variance' => 'decimal:4',
        'blind_count' => 'boolean',
        'counted_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(StockOpnameSession::class, 'session_id');
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function counter()
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get variance percentage.
     */
    public function getVariancePercentageAttribute(): ?float
    {
        if ($this->system_qty == 0) {
            return $this->variance != 0 ? 100 : 0;
        }

        return round(($this->variance / $this->system_qty) * 100, 2);
    }

    /**
     * Check if variance exceeds threshold.
     */
    public function exceedsThreshold(float $threshold): bool
    {
        $percentage = abs($this->variance_percentage ?? 0);
        return $percentage > $threshold;
    }
}
