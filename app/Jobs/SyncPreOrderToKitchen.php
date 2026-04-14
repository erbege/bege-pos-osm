<?php

namespace App\Jobs;

use App\Models\Reservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Domain\Reservation\Enums\ReservationStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncPreOrderToKitchen implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Reservation $reservation)
    {
    }

    public function handle(): void
    {
        DB::transaction(function () {
            // 1. Ensure reservation is in preparing status
            if ($this->reservation->status !== ReservationStatus::Preparing) {
                return;
            }

            // 2. Create order if not exists
            $order = $this->reservation->order;

            if (!$order) {
                $order = Order::create([
                    'reservation_id' => $this->reservation->id,
                    'branch_id' => $this->reservation->branch_id,
                    'user_id' => $this->reservation->created_by,
                    'table_id' => $this->reservation->tables()->first()?->id,
                    'total_amount' => $this->reservation->total_estimated_amount,
                    'status' => 'Preparing',
                    'payment_method' => $this->reservation->payment_mode === 'full' ? 'gateway' : null,
                ]);

                $this->reservation->update(['order_id' => $order->id]);
            }

            // 3. Sync Menu Items
            foreach ($this->reservation->menus as $resMenu) {
                // Check if already synced
                $exists = OrderItem::where('order_id', $order->id)
                    ->where('menu_id', $resMenu->menu_id)
                    ->where('notes', "Pre-order for Reservation #{$this->reservation->reservation_number}")
                    ->exists();

                if (!$exists) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_id' => $resMenu->menu_id,
                        'qty' => $resMenu->quantity,
                        'price' => $resMenu->price_snapshot,
                        'subtotal' => $resMenu->quantity * $resMenu->price_snapshot,
                        'status' => 'Preparing',
                        'notes' => "Pre-order for Reservation #{$this->reservation->reservation_number}",
                        'preparing_at' => now(),
                    ]);
                }
            }

            // 4. Trigger KDS Refresh Event
            event(new \App\Events\OrderStatusUpdated($order->load(['items.menu', 'table'])));

            Log::info("Pre-order synced to Kitchen for Reservation [{$this->reservation->reservation_number}]");
        });
    }
}
