<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\StockMovement;

class OrderInventoryService
{
    public function deductStock(Order $order)
    {
        // Dispatch stock deduction asynchronously to the queue
        \App\Jobs\DeductStockJob::dispatch($order);
    }
}
