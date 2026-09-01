<?php

namespace App\Jobs;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Reservation\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExpirePendingReservationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Reservation::query()
            ->whereIn('status', [ReservationStatus::PendingPayment, ReservationStatus::Draft])
            ->where('payment_status', '!=', PaymentStatus::Paid)
            ->where('expires_at', '<=', now())
            ->chunk(100, function ($reservations) {
                foreach ($reservations as $reservation) {
                    ExpireReservationJob::dispatch($reservation);
                }
            });
    }
}
