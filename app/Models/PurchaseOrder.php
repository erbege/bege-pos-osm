<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;
use Illuminate\Support\Str;

class PurchaseOrder extends Model
{
    use BelongsToBranch;

    protected $guarded = [];

    protected $casts = [
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($po) {
            if (!$po->po_number) {
                $po->po_number = 'PO-' . strtoupper(Str::random(8));
            }
        });
    }
}
