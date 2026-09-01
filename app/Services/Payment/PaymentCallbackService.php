<?php

namespace App\Services\Payment;

use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use App\Services\Order\OrderPaymentService;
use App\Services\Payment\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentCallbackService
{
    /**
     * Handle incoming webhook.
     * @param string $provider
     * @param Request|array $request
     */
    public function handle(string $provider, $request)
    {
        $payload = $request instanceof Request ? $request->all() : $request;

        // Signature Validation
        if (!$this->validateSignature($provider, $request)) {
            Log::warning("Invalid signature from {$provider} webhook", $payload);
            return false;
        }

        return DB::transaction(function () use ($provider, $payload) {

            $parsed = $this->parsePayload($provider, $payload);

            if (!$parsed['reference_id']) {
                Log::warning("Webhook from {$provider} missing reference ID", $payload);
                return false;
            }

            // Check if this is a Reservation Payment (e.g. DP-RESERV123-ABCD)
            if (str_starts_with((string) $parsed['reference_id'], 'DP-')) {
                return $this->handleReservationPayment($parsed);
            }

            // Find payment by its internal database ID
            $payment = Payment::with('order')->find($parsed['reference_id']);

            // Some providers return our merchant_ref (which might be POS-123-xxx).
            if (!$payment && preg_match('/POS-(\d+)-/', (string)$parsed['reference_id'], $matches)) {
                $payment = Payment::with('order')->find($matches[1]);
            }

            if (!$payment) {
                // Try looking up by the gateway_reference we saved during generation
                $payment = Payment::with('order')->where('reference_id', $parsed['reference_id'])->first();
                if (!$payment) {
                    Log::error("Webhook Payment not found for reference: " . $parsed['reference_id']);
                    return false;
                }
            }

            // If it's a success callback and already success, exit successfully
            if ($parsed['is_success'] && $payment->status === 'success') {
                return true;
            }

            // HANDLE REFUND / VOIDED / EXPIRED
            if (in_array($parsed['status_raw'], ['REFUNDED', 'VOIDED', 'EXPIRED', 'FAILED'])) {
                $this->processRefund($payment, $parsed['status_raw']);
                return true;
            }

            if (!$parsed['is_success']) {
                $payment->update(['status' => 'failed']);
                return true;
            }

            // Route to standard Order Payment logic which handles finance, inventory, and kitchen broadcast
            app(OrderPaymentService::class)
                ->markAsPaid(
                    $payment->order,
                    $payment->payment_method ?: 'ONLINE_GATEWAY',
                    $parsed['gateway_transaction_id'] ?? $parsed['reference_id']
                );

            // Mark the initial placeholder payment record as success
            $payment->update([
                'status' => 'success',
                'reference_id' => $parsed['gateway_transaction_id'] ?? $parsed['reference_id']
            ]);

            return true;
        });
    }

    private function validateSignature(string $provider, $request): bool
    {
        if (!$request instanceof Request) return true; // Skip for array payloads (internal simulation)

        switch (strtolower($provider)) {
            case 'tripay':
                $privateKey = PaymentGatewayService::getProviderSetting('tripay', 'secret_key');
                if (!$privateKey) return true;

                $callbackSignature = $request->header('X-Callback-Signature');
                $json = $request->getContent();
                $signature = hash_hmac('sha256', $json, $privateKey);

                if ($callbackSignature !== $signature) {
                    Log::error('Tripay Signature Mismatch', [
                        'expected' => $signature,
                        'received' => $callbackSignature
                    ]);
                    return false;
                }
                return true;

            case 'midtrans':
                // Midtrans validation is usually done by checking status with their API or using server key hash
                return true; 

            default:
                return true;
        }
    }

    /**
     * Reversal logic for refunded or voided payments.
     */
    private function processRefund(Payment $payment, string $status)
    {
        if ($payment->status === 'refunded' || $payment->status === 'failed')
            return;

        DB::transaction(function () use ($payment, $status) {
            $payment->update(['status' => strtolower($status)]);

            if ($payment->order) {
                // For a failed payment, we don't necessarily cancel the order yet, 
                // but for EXPIRED or VOIDED we might.
                if (in_array($status, ['REFUNDED', 'VOIDED', 'EXPIRED'])) {
                    $payment->order->update(['status' => 'Cancelled']);

                    // Create a reversal transaction (expense)
                    \App\Models\Transaction::create([
                        'type' => 'expense',
                        'amount' => $payment->amount,
                        'description' => "REVERSAL: POS Order #" . $payment->order_id . " - " . $status,
                        'date' => now(),
                        'reference_type' => get_class($payment),
                        'reference_id' => $payment->id,
                    ]);

                    // Try to free up table if it was occupied
                    if ($payment->order->table_id) {
                        \App\Models\Table::where('id', $payment->order->table_id)->update(['status' => 'available']);
                    }
                }
            }
        });

        Log::info("Payment {$payment->id} marked as {$status} and processed.");
    }

    private function handleReservationPayment(array $parsed)
    {
        $payment = \App\Models\ReservationPayment::with('reservation')->where('payment_reference', $parsed['reference_id'])->first();

        if (!$payment) {
            Log::error("Webhook Reservation Payment not found for reference: " . $parsed['reference_id']);
            return false;
        }

        if ($payment->status === 'success' || $payment->status === 'paid') {
            return true;
        }

        if (!$parsed['is_success']) {
            $payment->update(['status' => 'failed']);
            return true;
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'gateway_transaction_id' => $parsed['gateway_transaction_id'] ?? $parsed['reference_id']
        ]);

        // Dispatch domain event to advance saga
        event(new \App\Events\ReservationPaymentReceived($payment));
        return true;
    }

    private function parsePayload(string $provider, array $payload): array
    {
        $result = [
            'reference_id' => null,
            'is_success' => false,
            'gateway_transaction_id' => null,
            'status_raw' => null
        ];

        switch (strtolower($provider)) {
            case 'ipaymu':
                $result['reference_id'] = $payload['reference_id'] ?? null;
                $result['gateway_transaction_id'] = $payload['trx_id'] ?? null;
                $result['status_raw'] = (string) ($payload['status'] ?? '');
                $result['is_success'] = in_array((int) ($payload['status'] ?? 0), [1, 6]);
                break;

            case 'tripay':
                $result['reference_id'] = $payload['merchant_ref'] ?? null;
                $result['gateway_transaction_id'] = $payload['reference'] ?? null;
                $result['status_raw'] = strtoupper($payload['status'] ?? '');
                $result['is_success'] = $result['status_raw'] === 'PAID';
                break;

            case 'midtrans':
                $result['reference_id'] = $payload['order_id'] ?? null;
                $result['gateway_transaction_id'] = $payload['transaction_id'] ?? null;
                $status = strtolower($payload['transaction_status'] ?? '');
                $result['status_raw'] = strtoupper($status);
                $result['is_success'] = in_array($status, ['capture', 'settlement']);
                if (in_array($status, ['deny', 'cancel', 'expire']))
                    $result['status_raw'] = 'VOIDED';
                if ($status === 'refund')
                    $result['status_raw'] = 'REFUNDED';
                break;

            case 'xendit':
                $result['reference_id'] = $payload['external_id'] ?? $payload['reference_id'] ?? ($payload['data']['reference_id'] ?? null);
                $result['gateway_transaction_id'] = $payload['payment_id'] ?? $payload['id'] ?? ($payload['data']['id'] ?? null);
                $status = strtoupper($payload['status'] ?? ($payload['data']['status'] ?? 'PAID'));
                $result['status_raw'] = $status;
                $result['is_success'] = in_array($status, ['COMPLETED', 'PAID', 'SUCCEEDED', 'SETTLED']);
                break;

            case 'simulation':
                $result['reference_id'] = $payload['reference'] ?? null;
                $result['gateway_transaction_id'] = $payload['transaction_id'] ?? null;
                $result['status_raw'] = strtoupper($payload['status'] ?? '');
                $result['is_success'] = $result['status_raw'] === 'SUCCESS';
                break;
        }

        return $result;
    }
}
