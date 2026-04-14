<?php

namespace App\States\Order;

class PreparingState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Ready', 'Cancelled'];
    }
}
