<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;
use App\Models\Setting;
use App\Services\Payment\PaymentGatewayService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IpaymuGateway implements PaymentGatewayInterface
{
    public function requestQRTransaction(Payment $payment): array
    {
        $va = PaymentGatewayService::getProviderSetting('ipaymu', 'merchant_id');
        $apiKey = PaymentGatewayService::getProviderSetting('ipaymu', 'api_key');

        if (!$va || !$apiKey) {
            return [
                'qr_url' => "https://quickchart.io/qr?text=SIMULATED_IPAYMU_QR_" . $payment->id . "&size=300",
                'gateway_reference' => 'SIM-IPAY-' . time(),
            ];
        }

        $url = 'https://my.ipaymu.com/api/v2/payment/direct';
        $body = [
            'name' => $payment->order->customer_name ?: 'POS Customer',
            'phone' => '08123456789',
            'email' => 'customer@example.com',
            'amount' => (int) $payment->amount,
            'notifyUrl' => route('payment.callback', ['provider' => 'ipaymu']),
            'expired' => 24,
            'paymentMethod' => 'qris',
            'referenceId' => 'POS-' . $payment->id . '-' . time(),
        ];

        $jsonBody = json_encode($body);
        $signature = hash_hmac('sha256', $va . ':' . $apiKey . ':' . $jsonBody, $apiKey);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'va' => $va,
            'signature' => $signature,
            'timestamp' => now()->format('YmdHis'),
        ])->post($url, $body);

        $result = $response->json();

        if ($response->successful() && isset($result['Data']['QrString'])) {
            return [
                'qr_url' => "https://quickchart.io/qr?text=" . urlencode($result['Data']['QrString']) . "&size=300",
                'gateway_reference' => $result['Data']['SessionID'] ?? null,
            ];
        }

        throw new \Exception('Ipaymu QRIS Error: ' . ($result['Message'] ?? 'Unknown error'));
    }

    public function requestVATransaction(Payment $payment): array
    {
        $va = PaymentGatewayService::getProviderSetting('ipaymu', 'merchant_id');
        $apiKey = PaymentGatewayService::getProviderSetting('ipaymu', 'api_key');

        if (!$va || !$apiKey) {
            return [
                'virtual_account' => '1100' . rand(10000000, 99999999),
                'gateway_reference' => 'SIM-IPAY-VA-' . time(),
                'expired_at' => now()->addDay()->toDateTimeString(),
            ];
        }

        $url = 'https://my.ipaymu.com/api/v2/payment/direct';
        
        // iPaymu bank mapping
        $bank = strtolower(str_replace('_VA', '', $payment->payment_channel));

        $body = [
            'name' => $payment->order->customer_name ?: 'POS Customer',
            'amount' => (int) $payment->amount,
            'notifyUrl' => route('payment.callback', ['provider' => 'ipaymu']),
            'paymentMethod' => 'va',
            'paymentChannel' => $bank,
            'referenceId' => 'POS-VA-' . $payment->id . '-' . time(),
        ];

        $jsonBody = json_encode($body);
        $signature = hash_hmac('sha256', $va . ':' . $apiKey . ':' . $jsonBody, $apiKey);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'va' => $va,
            'signature' => $signature,
        ])->post($url, $body);

        $result = $response->json();

        if ($response->successful() && isset($result['Data']['PaymentNo'])) {
            return [
                'virtual_account' => $result['Data']['PaymentNo'],
                'gateway_reference' => $result['Data']['SessionID'] ?? null,
                'expired_at' => isset($result['Data']['Expired']) ? $result['Data']['Expired'] : null,
            ];
        }

        throw new \Exception('Ipaymu VA Error: ' . ($result['Message'] ?? 'Unknown error'));
    }
}
