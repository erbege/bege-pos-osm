<?php

namespace App\States\Order;

class ReadyState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Served'];
    }
}
