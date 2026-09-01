<?php

namespace App\States\Order;

class CompletedState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return [];
    }
}
