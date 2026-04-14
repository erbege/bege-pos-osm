<?php

namespace App\Jobs;

use App\Domain\Reservation\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireReservationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation
    ) {
    }

    public function handle(): void
    {
        DB::transaction(function () {
            // Lock the row to prevent race conditions (e.g., payment webhook arriving exactly now)
            $lockedReservation = Reservation::where('id', $this->reservation->id)->lockForUpdate()->first();

            if (!$lockedReservation) {
                return;
            }

            // Double-check if still expired/unpaid (Status could have changed in milliseconds)
            if (
                $lockedReservation->status !== ReservationStatus::PendingPayment &&
                $lockedReservation->status !== ReservationStatus::Draft
            ) {
                return;
            }

            try {
                // Use the State Machine to transition
                $lockedReservation->transitionTo(ReservationStatus::Cancelled);
                $lockedReservation->save();

                // Dispatch additional jobs if needed (e.g. freeing tables, notifying user)
                // ReleaseReservedTableJob::dispatch($lockedReservation);

                Log::info("Reservation [{$lockedReservation->reservation_number}] auto-expired.");

            } catch (\Exception $e) {
                Log::error("Failed to auto-expire reservation [{$lockedReservation->reservation_number}]: " . $e->getMessage());
                throw $e;
            }
        });
    }
}
