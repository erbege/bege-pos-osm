<?php

namespace App\States\Order;

class CancelledState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return [];
    }
}
