<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;
use App\Models\Setting;
use App\Services\Payment\PaymentGatewayService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransGateway implements PaymentGatewayInterface
{
    public function requestQRTransaction(Payment $payment): array
    {
        $serverKey = PaymentGatewayService::getProviderSetting('midtrans', 'secret_key');

        if (!$serverKey) {
            return [
                'qr_url' => "https://quickchart.io/qr?text=SIMULATED_MIDTRANS_QR_" . $payment->id . "&size=300",
                'gateway_reference' => 'SIM-MID-' . time(),
            ];
        }

        $url = 'https://api.sandbox.midtrans.com/v2/charge'; // Default to sandbox
        if (PaymentGatewayService::getProviderSetting('midtrans', 'mode') === 'production') {
            $url = 'https://api.midtrans.com/v2/charge';
        }

        $payload = [
            'payment_type' => 'gopay', // Using GoPay for QRIS in Midtrans
            'transaction_details' => [
                'order_id' => 'POS-' . $payment->id . '-' . time(),
                'gross_amount' => (int) $payment->amount,
            ],
        ];

        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($serverKey . ':')
        ])->post($url, $payload);

        $result = $response->json();

        if ($response->successful() && isset($result['actions'])) {
            $qrAction = collect($result['actions'])->firstWhere('name', 'generate-qr-code');
            return [
                'qr_url' => $qrAction['url'] ?? null,
                'gateway_reference' => $result['transaction_id'] ?? null,
            ];
        }

        throw new \Exception('Midtrans QRIS Error: ' . ($result['status_message'] ?? 'Unknown error'));
    }

    public function requestVATransaction(Payment $payment): array
    {
        $serverKey = PaymentGatewayService::getProviderSetting('midtrans', 'secret_key');

        if (!$serverKey) {
            return [
                'virtual_account' => '9900' . rand(10000000, 99999999),
                'gateway_reference' => 'SIM-MID-VA-' . time(),
                'expired_at' => now()->addDay()->toDateTimeString(),
            ];
        }

        $url = PaymentGatewayService::getProviderSetting('midtrans', 'mode') === 'production' 
            ? 'https://api.midtrans.com/v2/charge'
            : 'https://api.sandbox.midtrans.com/v2/charge';

        // Midtrans bank mapping
        $bank = strtolower(str_replace('_VA', '', $payment->payment_channel));
        if ($bank === 'mandiri') {
            $payload = [
                'payment_type' => 'echannel',
                'transaction_details' => ['order_id' => 'POS-VA-' . $payment->id . '-' . time(), 'gross_amount' => (int) $payment->amount],
                'echannel' => ['bill_info1' => 'Payment For:', 'bill_info2' => 'POS Order']
            ];
        } else {
            $payload = [
                'payment_type' => 'bank_transfer',
                'transaction_details' => ['order_id' => 'POS-VA-' . $payment->id . '-' . time(), 'gross_amount' => (int) $payment->amount],
                'bank_transfer' => ['bank' => $bank]
            ];
        }

        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($serverKey . ':')
        ])->post($url, $payload);

        $result = $response->json();

        if ($response->successful()) {
            $vaNumber = null;
            if ($bank === 'mandiri') {
                $vaNumber = ($result['bill_key'] ?? '') . ' / ' . ($result['biller_code'] ?? '');
            } else {
                $vaNumber = $result['va_numbers'][0]['va_number'] ?? null;
            }

            return [
                'virtual_account' => $vaNumber,
                'gateway_reference' => $result['transaction_id'] ?? null,
                'expired_at' => isset($result['expiry_time']) ? now()->parse($result['expiry_time'])->toDateTimeString() : null,
            ];
        }

        throw new \Exception('Midtrans VA Error: ' . ($result['status_message'] ?? 'Unknown error'));
    }
}
