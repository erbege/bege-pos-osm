<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;
use App\Models\Setting;
use App\Services\Payment\PaymentGatewayService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditGateway implements PaymentGatewayInterface
{
    public function requestQRTransaction(Payment $payment): array
    {
        $secretKey = PaymentGatewayService::getProviderSetting('xendit', 'secret_key');

        if (!$secretKey) {
            // Simulator for local testing if no keys provided
            return [
                'qr_url' => "https://quickchart.io/qr?text=SIMULATED_QR_" . $payment->id . "&size=300",
                'gateway_reference' => 'SIM-' . time(),
            ];
        }

        $url = 'https://api.xendit.co/qr_codes';

        $payload = [
            'reference_id' => 'POS-' . $payment->id . '-' . time(),
            'type' => 'DYNAMIC',
            'currency' => 'IDR',
            'amount' => (int) $payment->amount,
            'expires_at' => now()->addDay()->toIso8601String(),
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'api-version' => '2022-07-31',
            'Authorization' => 'Basic ' . base64_encode($secretKey . ':')
        ])->post($url, $payload);

        $result = $response->json();

        if ($response->successful() && isset($result['qr_string'])) {
            $renderedQrImageUrl = "https://quickchart.io/qr?text=" . urlencode($result['qr_string']) . "&size=300";

            return [
                'qr_url' => $renderedQrImageUrl,
                'gateway_reference' => $result['id'] ?? null,
            ];
        }

        Log::error('Xendit QRIS Error', ['response' => $result, 'status' => $response->status()]);
        throw new \Exception('Failed to generate Xendit QRIS: ' . ($result['message'] ?? 'Unknown error'));
    }

    public function requestVATransaction(Payment $payment): array
    {
        $secretKey = PaymentGatewayService::getProviderSetting('xendit', 'secret_key');

        if (!$secretKey) {
            // Simulator for local testing
            return [
                'virtual_account' => '8808' . rand(10000000, 99999999),
                'gateway_reference' => 'SIM-VA-' . time(),
                'expired_at' => now()->addDay()->toDateTimeString(),
            ];
        }

        $url = 'https://api.xendit.co/callback_virtual_accounts';

        // Map payment channel to Xendit bank code (e.g. BCA_VA -> BCA)
        $bankCode = strtoupper(str_replace('_VA', '', $payment->payment_channel));

        $payload = [
            'external_id' => 'POS-VA-' . $payment->id . '-' . time(),
            'bank_code' => $bankCode,
            'name' => ($payment->order && $payment->order->customer_name) ? $payment->order->customer_name : 'POS Customer',
            'expected_amount' => (int) $payment->amount,
            'is_closed' => true,
            'is_single_use' => true,
            'expiration_date' => now()->addDay()->toIso8601String(),
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($secretKey . ':')
        ])->post($url, $payload);

        $result = $response->json();

        if ($response->successful() && isset($result['account_number'])) {
            return [
                'virtual_account' => $result['account_number'],
                'gateway_reference' => $result['id'] ?? null,
                'expired_at' => isset($result['expiration_date']) ? now()->parse($result['expiration_date'])->toDateTimeString() : null,
            ];
        }

        Log::error('Xendit VA Error', ['response' => $result, 'status' => $response->status()]);
        throw new \Exception('Failed to generate Xendit VA: ' . ($result['message'] ?? 'Unknown error'));
    }
}
