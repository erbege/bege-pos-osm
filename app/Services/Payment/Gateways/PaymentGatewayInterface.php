<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;

interface PaymentGatewayInterface
{
    /**
     * Request a QRIS transaction from the payment gateway provider.
     * 
     * @param Payment $payment The payment record
     * @return array Returns ['qr_url' => string, 'gateway_reference' => string|null]
     * @throws \Exception If the gateway request fails
     */
    public function requestQRTransaction(Payment $payment): array;

    /**
     * Request a Virtual Account transaction from the payment gateway provider.
     * 
     * @param Payment $payment The payment record
     * @return array Returns ['virtual_account' => string, 'gateway_reference' => string|null, 'expired_at' => string|null]
     * @throws \Exception If the gateway request fails
     */
    public function requestVATransaction(Payment $payment): array;
}
