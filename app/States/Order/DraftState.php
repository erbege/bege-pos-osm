<?php

namespace App\States\Order;

class DraftState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Pending Payment', 'Cancelled'];
    }
}
