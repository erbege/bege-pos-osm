<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use App\Events\OrderPaid;
use App\Jobs\ProcessOrderJob;

class OrderPaymentService
{
    public function markAsPaid(Order $order, $method, $gatewayRef = null, $approvalCode = null)
    {
        $result = DB::transaction(function () use ($order, $method, $gatewayRef, $approvalCode) {

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total_amount,
                'gateway' => $method,
                'reference_id' => $gatewayRef,
                'approval_code' => $approvalCode, // Storing in reference_id or new column
                'status' => 'success',
            ]);

            $order->update([
                'status' => 'Paid',
                'payment_status' => 'PAID'
            ]);

            \App\Models\Transaction::create([
                'type' => 'income',
                'amount' => $order->total_amount,
                'description' => "POS Order #" . $order->id . " - " . $method,
                'date' => now(),
                'branch_id' => $order->branch_id,
            ]);

            // Auto-release: free the table when order is paid
            if ($order->table_id) {
                // Only release if NO other active orders exist for this table
                $otherOrders = Order::where('table_id', $order->table_id)
                    ->where('id', '!=', $order->id)
                    ->whereIn('status', ['Draft', 'Pending Payment'])
                    ->exists();

                if (!$otherOrders) {
                    \App\Models\Table::where('id', $order->table_id)->update(['status' => 'available']);
                }
            }

            return $payment;
        });

        // 1. Dispatch background jobs AFTER transaction for better reliability
        \App\Jobs\ProcessOrderJob::dispatch($order);

        // 2. Broadcast status update IMMEDIATELY so UI doesn't hang or look stuck
        // This ensures the customer page jumps to 'Confirmed' without waiting for queue
        event(new \App\Events\OrderStatusUpdated($order));

        // 3. Dispatch OrderPaid for inventory fulfillment
        event(new \App\Events\OrderPaid($order));

        return $result;
    }
}
