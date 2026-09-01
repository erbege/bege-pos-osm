<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Generate payment instruction (e.g. QRIS string) for an order.
     *
     * @param Order $order
     * @param string $gateway
     * @return Payment
     */
    public function initiatePayment(Order $order, string $gateway): Payment
    {
        // Example mock QRIS logic or Tripay integration
        if ($gateway === 'QRIS') {
            $referenceId = 'QRIS-' . Str::random(10);
            return Payment::create([
                'order_id' => $order->id,
                'gateway' => $gateway,
                'amount' => $order->total_amount,
                'status' => 'pending',
                'reference_id' => $referenceId,
            ]);
        }

        // Return a default cash payment entry
        return Payment::create([
            'order_id' => $order->id,
            'gateway' => 'Cash',
            'amount' => $order->total_amount,
            'status' => 'success',
            'reference_id' => 'CASH-' . Str::random(10),
        ]);
    }

    /**
     * Handle webhook or payment callback success logic.
     *
     * @param string $referenceId
     * @return Payment|null
     */
    public function handleSuccess(string $referenceId): ?Payment
    {
        $payment = Payment::where('reference_id', $referenceId)->first();

        if ($payment && $payment->status !== 'success') {
            $payment->update(['status' => 'success']);

            $order = $payment->order;
            if ($order) {
                // Dependency injection of OrderService logic would update status to "Paid"
                $order->update(['status' => 'Paid']);

                // Inventory service should deduct stock now
                app(InventoryService::class)->deductStockForOrder($order);
            }
        }

        return $payment;
    }
}
