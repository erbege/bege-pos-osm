<?php

namespace App\Listeners;

use App\Events\InventoryConsumed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessInventoryConsumed
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(InventoryConsumed $event): void
    {
        //
    }
}
