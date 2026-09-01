<?php

namespace App\States\Order;

class PaidState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Preparing', 'Cancelled'];
    }
}
