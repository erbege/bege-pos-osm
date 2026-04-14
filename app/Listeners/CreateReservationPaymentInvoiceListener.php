<?php

namespace App\Listeners;

use App\Events\ReservationCreated;
use App\Models\ReservationPayment;
use Illuminate\Support\Str;

class CreateReservationPaymentInvoiceListener
{
    /**
     * Handle the event.
     */
    public function handle(ReservationCreated $event): void
    {
        $reservation = $event->reservation;

        $amount = 0;
        $paymentType = 'full';

        if ($reservation->payment_mode === 'dp') {
            $amount = (float) $reservation->dp_amount;
            $paymentType = 'dp';
        } elseif ($reservation->payment_mode === 'full') {
            $amount = (float) $reservation->total_estimated_amount;
            $paymentType = 'full';
        }

        // Only create invoice if amount > 0
        if ($amount > 0) {
            // Generate a unique payment reference
            $paymentRef = strtoupper($paymentType) . '-' . $reservation->reservation_number . '-' . Str::upper(Str::random(4));

            ReservationPayment::create([
                'reservation_id' => $reservation->id,
                'payment_reference' => $paymentRef,
                'payment_method' => 'gateway',
                'payment_type' => $paymentType,
                'amount' => $amount,
                'status' => 'pending',
                'created_by' => $reservation->created_by
            ]);
        }
    }
}
