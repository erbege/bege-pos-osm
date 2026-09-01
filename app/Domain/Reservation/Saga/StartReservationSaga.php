<?php

namespace App\Domain\Reservation\Saga;

use App\Models\Reservation;
use App\Events\ReservationCreated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class StartReservationSaga
{
    /**
     * Start the saga to create invoice and send payment link.
     * This relies on synchronous event listeners for the steps.
     * If any step fails, an exception is thrown and the transaction rolls back.
     */
    public function execute(Reservation $reservation)
    {
        DB::beginTransaction();
        try {
            // Step 1: Dispatch ReservationCreated event
            // Listeners:
            // - CreateReservationPaymentInvoiceListener (Creates DP invoice in DB and Payment Gateway)
            // - SendReservationPaymentLinkListener (Sends email/WA to customer)
            // - ScheduleReservationExpiration (Schedules the auto-expire if not paid)

            event(new ReservationCreated($reservation));

            DB::commit();
            Log::info("Saga StartReservationSaga completed successfully for Reservation [{$reservation->reservation_number}]");

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error("Saga StartReservationSaga failed for Reservation [{$reservation->reservation_number}]: " . $e->getMessage());

            // Compensation logic:
            // 1. Cancel the reservation via the State Machine if it's not already cancelled
            $this->compensate($reservation);

            throw $e;
        }
    }

    private function compensate(Reservation $reservation)
    {
        try {
            // Hard delete or transition to rejected/cancelled to free up tables
            // Since this is within the same request that failed to create the full reservation flow,
            // we can just forcefully delete the draft or change status.
            $reservation->delete();
            Log::info("Compensation successful. Deleted failed Reservation [{$reservation->reservation_number}].");
        } catch (Throwable $e) {
            Log::critical("CRITICAL: Compensation failed for Reservation [{$reservation->reservation_number}]: " . $e->getMessage());
        }
    }
}
