<?php

namespace App\Models;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Reservation\Enums\ReservationStatus;
use App\Domain\Reservation\State\ReservationStateMachine;
use App\Events\ReservationStatusChanged;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    BelongsTo,
    BelongsToMany,
    HasMany,
    HasOne
};
use Illuminate\Support\Str;

class Reservation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'reservation_number',
        'branch_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'guest_count',
        'reservation_date',
        'start_time',
        'end_time',
        'room_id',
        'table_combination_json',
        'status',
        'payment_status',
        'payment_mode',
        'is_dp_required',
        'dp_percentage',
        'dp_amount',
        'total_estimated_amount',
        'final_total_amount',
        'order_id',
        'expires_at',
        'checked_in_at',
        'completed_at',
        'cancelled_at',
        'no_show_at',
        'created_by',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'expires_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'no_show_at' => 'datetime',
        'status' => ReservationStatus::class,
        'payment_status' => PaymentStatus::class,
        'is_dp_required' => 'boolean',
        'dp_percentage' => 'decimal:2',
        'dp_amount' => 'decimal:2',
        'total_estimated_amount' => 'decimal:2',
        'final_total_amount' => 'decimal:2',
    ];

    protected $appends = ['pax', 'reservation_time'];

    public function getPaxAttribute()
    {
        return $this->guest_count;
    }

    public function getReservationTimeAttribute()
    {
        return $this->start_time;
    }

    protected static function booted()
    {
        static::creating(function ($reservation) {
            if (!$reservation->uuid) {
                $reservation->uuid = (string) Str::uuid();
            }

            if (!$reservation->reservation_number) {
                $dateStr = \Carbon\Carbon::parse($reservation->reservation_date ?? now())->format('ymd');
                $branchId = $reservation->branch_id ?? 1;
                $random = Str::upper(Str::random(4));
                $reservation->reservation_number = "RSV-{$dateStr}-B{$branchId}-{$random}";
            }
        });
    }

    public function transitionTo(
        ReservationStatus $newStatus,
        ?int $userId = null
    ): void {
        $stateMachine = new ReservationStateMachine();

        // Allow transition from null if it's a new record (default to Draft if null)
        $currentStatus = $this->status ?? ReservationStatus::Draft;

        if (!$stateMachine->canTransition($currentStatus, $newStatus)) {
            throw new \DomainException(
                "Invalid transition from " . ($this->status ? $this->status->value : 'Initial') . " to {$newStatus->value}"
            );
        }

        // DP Payment Guard
        if ($newStatus === ReservationStatus::Confirmed) {
            if ($this->payment_status !== PaymentStatus::Paid) {
                throw new \DomainException(
                    "Reservation cannot be confirmed before DP payment."
                );
            }
        }

        $oldStatus = $this->status;

        switch ($newStatus) {
            case ReservationStatus::CheckedIn:
                $this->checked_in_at = \Illuminate\Support\Carbon::now();
                break;
            case ReservationStatus::Completed:
                $this->completed_at = \Illuminate\Support\Carbon::now();
                break;
            case ReservationStatus::Cancelled:
                $this->cancelled_at = \Illuminate\Support\Carbon::now();
                break;
            case ReservationStatus::NoShow:
                $this->no_show_at = \Illuminate\Support\Carbon::now();
                break;
        }

        $this->update([
            'status' => $newStatus,
        ]);

        $this->events()->create([
            'event_type' => 'status_changed',
            'performed_by' => $userId,
            'old_value' => ['status' => $oldStatus->value],
            'new_value' => ['status' => $newStatus->value],
        ]);

        // Let external listeners hook into this
        event(new ReservationStatusChanged($this, $newStatus, $oldStatus));
    }

    public function getTotalPaidAttribute()
    {
        return $this->payments()
            ->where('status', 'paid')
            ->sum('amount');
    }

    public function getRemainingAmountAttribute()
    {
        return $this->total_estimated_amount - $this->total_paid;
    }

    public function syncPaymentStatus()
    {
        $paid = $this->total_paid;

        if ($paid == 0) {
            $this->payment_status = PaymentStatus::Unpaid;
        } elseif ($paid < $this->dp_amount) {
            $this->payment_status = PaymentStatus::Partial;
        } else {
            $this->payment_status = PaymentStatus::Paid;
        }

        $this->save();
    }


    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(Table::class, 'reservation_tables');
    }

    public function reservation_tables(): HasMany
    {
        return $this->hasMany(ReservationTable::class);
    }

    public function menus(): HasMany
    {
        return $this->hasMany(ReservationMenu::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ReservationPayment::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ReservationEvent::class);
    }

    public function setups(): HasMany
    {
        return $this->hasMany(ReservationSetup::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
