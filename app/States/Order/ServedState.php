<?php

namespace App\States\Order;

class ServedState extends OrderState
{
    protected function allowedTransitions(): array
    {
        return ['Completed'];
    }
}
