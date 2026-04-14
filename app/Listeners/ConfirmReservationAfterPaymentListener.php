<?php

namespace App\Listeners;

use App\Events\ReservationPaymentReceived;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Reservation\Enums\ReservationStatus;
use Illuminate\Support\Facades\Log;

class ConfirmReservationAfterPaymentListener
{
    /**
     * Handle the event.
     */
    public function handle(ReservationPaymentReceived $event): void
    {
        $payment = $event->payment;
        $reservation = $payment->reservation;

        if ($payment->status === 'paid') {
            // Update the reservation's payment sync status first
            $reservation->syncPaymentStatus();

            // Check if it's eligible to be confirmed
            if ($reservation->payment_status === PaymentStatus::Paid) {
                try {
                    // Try to transition state to confirmed
                    $reservation->transitionTo(ReservationStatus::Confirmed);
                    Log::info("Reservation [{$reservation->reservation_number}] confirmed after payment.");

                    // Could dispatch a mail/notification job here
                } catch (\DomainException $e) {
                    Log::warning("Could not transition reservation to confirmed: " . $e->getMessage());
                }
            }
        }
    }
}
