<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;

class PaymentService
{
    public function create(Order $order, $method = 'QRIS', $channel = null)
    {
        $provider = Setting::getValue('payment_gateway', 'active_provider', 'Xendit');

        // Initial payment record
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => $provider,
            'payment_method' => $method,
            'payment_channel' => $channel,
            'amount' => $order->total_amount,
            'status' => 'pending'
        ]);

        // Explicitly set the order relation to avoid "property on null" errors in adapters
        $payment->setRelation('order', $order);

        if ($method === 'BANK_TRANSFER') {
            $gatewayData = app(PaymentGatewayService::class)->generateVA($payment);
            
            $payment->update([
                'reference_id' => $gatewayData['gateway_reference'] ?? null,
                'virtual_account' => $gatewayData['virtual_account'] ?? null,
                'expired_at' => $gatewayData['expired_at'] ?? null,
            ]);

            return [
                'payment' => $payment,
                'virtual_account' => $gatewayData['virtual_account'],
                'expired_at' => $gatewayData['expired_at'],
            ];
        }

        // Default: QRIS
        $gatewayData = app(PaymentGatewayService::class)->generateQR($payment);

        if (!empty($gatewayData['gateway_reference'])) {
            $payment->update(['reference_id' => $gatewayData['gateway_reference']]);
        }

        return [
            'payment' => $payment,
            'qr_url' => $gatewayData['qr_url']
        ];
    }
}
