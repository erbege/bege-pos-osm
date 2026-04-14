<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationMenu extends Model
{
    protected $fillable = [
        'reservation_id',
        'menu_id',
        'quantity',
        'price_snapshot',
        'scheduled_serve_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'price_snapshot' => 'decimal:2',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
