<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Payment\PaymentCallbackService;

class PaymentCallbackController extends Controller
{
    /**
     * Handle incoming webhooks from the Payment Gateway
     */
    public function handleWebhook(Request $request, $provider = 'simulation')
    {
        $success = app(PaymentCallbackService::class)->handle($provider, $request);

        if ($provider === 'tripay') {
            return response()->json(['success' => $success]);
        }

        return response()->json(['status' => $success ? 'ok' : 'failed']);
    }

    /**
     * Mock simulator endpoint that the customer hits by scanning the QR code
     * which internally triggers the webhook.
     */
    public function simulate(Request $request)
    {
        $payload = json_decode(base64_decode($request->query('payload')), true);

        if (!$payload)
            abort(400, 'Invalid Payload');

        app(PaymentCallbackService::class)->handle('simulation', $payload);

        return "Payment processed successfully! You can close this window. The POS screen should instantly update.";
    }
}
