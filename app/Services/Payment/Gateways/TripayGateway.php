<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;
use App\Models\Setting;
use App\Services\Payment\PaymentGatewayService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TripayGateway implements PaymentGatewayInterface
{
    public function requestQRTransaction(Payment $payment): array
    {
        $apiKey = PaymentGatewayService::getProviderSetting('tripay', 'api_key');
        $privateKey = PaymentGatewayService::getProviderSetting('tripay', 'secret_key');
        $merchantCode = PaymentGatewayService::getProviderSetting('tripay', 'merchant_id');
        $mode = PaymentGatewayService::getProviderSetting('tripay', 'mode', 'sandbox');

        if (!$apiKey || !$privateKey) {
            return [
                'qr_url' => "https://quickchart.io/qr?text=SIMULATED_TRIPAY_QR_" . $payment->id . "&size=300",
                'gateway_reference' => 'SIM-TRIPAY-' . time(),
            ];
        }

        // Real logic for Tripay QRIS
        $baseUrl = $mode === 'production' 
            ? 'https://tripay.co.id/api' 
            : 'https://tripay.co.id/api-sandbox';
        
        $url = $baseUrl . '/transaction/create';
        $merchantRef = 'POS-' . $payment->id . '-' . time();
        
        $payload = [
            'method'         => 'QRIS',
            'merchant_ref'   => $merchantRef,
            'amount'         => (int) $payment->amount,
            'customer_name'  => $payment->order->customer_name ?: 'POS Customer',
            'customer_email' => 'customer@example.com',
            'order_items'    => [
                [
                    'name' => 'POS Order #' . $payment->order_id,
                    'price' => (int) $payment->amount,
                    'quantity' => 1
                ]
            ],
            'signature'      => hash_hmac('sha256', $merchantCode.$merchantRef.(int)$payment->amount, $privateKey)
        ];

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])->post($url, $payload);
        $result = $response->json();

        if ($response->successful() && isset($result['data']['qr_url'])) {
            return [
                'qr_url' => $result['data']['qr_url'],
                'gateway_reference' => $result['data']['reference'] ?? null,
            ];
        }

        throw new \Exception('Tripay QRIS Error: ' . ($result['message'] ?? 'Unknown error'));
    }

    public function requestVATransaction(Payment $payment): array
    {
        $apiKey = PaymentGatewayService::getProviderSetting('tripay', 'api_key');
        $privateKey = PaymentGatewayService::getProviderSetting('tripay', 'secret_key');
        $merchantCode = PaymentGatewayService::getProviderSetting('tripay', 'merchant_id');
        $mode = PaymentGatewayService::getProviderSetting('tripay', 'mode', 'sandbox');

        if (!$apiKey || !$privateKey) {
            return [
                'virtual_account' => '7700' . rand(10000000, 99999999),
                'gateway_reference' => 'SIM-TRIPAY-VA-' . time(),
                'expired_at' => now()->addDay()->toDateTimeString(),
            ];
        }

        // Logic for Tripay VA
        $baseUrl = $mode === 'production' 
            ? 'https://tripay.co.id/api' 
            : 'https://tripay.co.id/api-sandbox';
            
        $url = $baseUrl . '/transaction/create';
        // Map payment channel to Tripay method (e.g. BCA_VA -> BCAVA)
        $bankCode = strtoupper(str_replace('_', '', $payment->payment_channel));
        $merchantRef = 'POS-' . $payment->id . '-' . time();

        $payload = [
            'method'         => $bankCode,
            'merchant_ref'   => $merchantRef,
            'amount'         => (int) $payment->amount,
            'customer_name'  => $payment->order->customer_name ?: 'POS Customer',
            'customer_email' => 'customer@example.com',
            'order_items'    => [
                [
                    'name' => 'POS Order #' . $payment->order_id,
                    'price' => (int) $payment->amount,
                    'quantity' => 1
                ]
            ],
            'signature'      => hash_hmac('sha256', $merchantCode.$merchantRef.(int)$payment->amount, $privateKey)
        ];

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])->post($url, $payload);
        $result = $response->json();

        if ($response->successful() && isset($result['data']['pay_code'])) {
            return [
                'virtual_account' => $result['data']['pay_code'],
                'gateway_reference' => $result['data']['reference'] ?? null,
                'expired_at' => isset($result['data']['expiry_date']) ? date('Y-m-d H:i:s', $result['data']['expiry_date']) : null,
            ];
        }

        throw new \Exception('Tripay VA Error: ' . ($result['message'] ?? 'Unknown error'));
    }
}
