<?php

namespace App\States\Order;

class PendingPaymentState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Paid', 'Cancelled'];
    }
}
