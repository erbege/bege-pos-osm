<?php

namespace App\Domain\Reservation\State;

use App\Domain\Reservation\Enums\ReservationStatus;

class ReservationStateMachine
{
    private array $transitions = [
        // From Draft -> PendingPayment (Waiting for DP)
        'draft' => [
            'pending_payment',
            'cancelled'
        ],

        // From PendingPayment -> Confirmed (DP Paid) or Cancelled
        'pending_payment' => [
            'confirmed',
            'cancelled',
            'rejected'
        ],

        // From Confirmed -> Preparing (T-2 Kitchen started)
        'confirmed' => [
            'preparing',
            'checked_in',
            'cancelled',
            'no_show'
        ],

        // From Preparing -> Ready (H-1 Floor setup or Food ready)
        'preparing' => [
            'ready',
            'checked_in',
            'cancelled'
        ],

        // From Ready -> CheckedIn
        'ready' => [
            'checked_in',
            'cancelled'
        ],

        // From CheckedIn -> Completed (Guest finished eating and paid full)
        'checked_in' => [
            'completed'
        ],

        // Terminal States
        'completed' => [],
        'cancelled' => [],
        'rejected' => [],
        'no_show' => [],
    ];

    public function canTransition(ReservationStatus $from, ReservationStatus $to): bool
    {
        $allowedTransitions = $this->transitions[$from->value] ?? [];
        return in_array($to->value, $allowedTransitions, true);
    }
}
