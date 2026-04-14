<?php

namespace App\Listeners;

use App\Events\ReservationCreated;
use Illuminate\Support\Facades\Log;

class SendReservationPaymentLinkListener
{
    /**
     * Handle the event.
     */
    public function handle(ReservationCreated $event): void
    {
        $reservation = $event->reservation;

        if ((float) $reservation->dp_amount > 0) {
            // Fetch the payment invoice link from DB or Gateway
            $payment = $reservation->payments()->where('payment_type', 'dp')->first();

            if ($payment) {
                // Mock sending WhatsApp/Email with link
                Log::info("Sending Payment Link to {$reservation->customer_phone} for Reservation [{$reservation->reservation_number}]. Ref: {$payment->payment_reference}");
            }
        } else {
            // Unlikely to happen in Saga due to business rules requiring DP, 
            // but log just in case.
            Log::info("No DP required for Reservation [{$reservation->reservation_number}]. Skipping payment link.");
        }
    }
}
