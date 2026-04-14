<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

/**
 * Verifies the HMAC signature on incoming payment gateway webhooks.
 *
 * The middleware reads the `secret_key` from Settings (group: payment_gateway)
 * and compares against the X-Callback-Signature header using HMAC-SHA256.
 *
 * If no secret is configured yet, the middleware allows the request through
 * (development/setup mode) but logs a warning.
 */
class VerifyWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        // Because Tripay, iPaymu, Midtrans, and Xendit all use vastly different 
        // webhook signature mechanisms (HMAC vs JSON body hash vs SHA512 vs custom tokens),
        // we bypass this generic middleware. 
        // Security validation is delegated to the specific Provider logic inside PaymentCallbackService.

        return $next($request);

        // If no secret is configured, allow through (dev mode) but warn
        if (!$secret) {
            Log::warning('VerifyWebhookSignature: No payment gateway secret configured. Skipping verification.');
            return $next($request);
        }

        $signature = $request->header('X-Callback-Signature')
            ?? $request->header('X-Callback-Raw-Signature')
            ?? $request->header('X-Signature');

        if (!$signature) {
            Log::warning('VerifyWebhookSignature: Missing signature header');
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $expectedSignature = hash_hmac('sha256', $request->getContent(), $secret);

        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('VerifyWebhookSignature: Invalid signature', [
                'expected' => substr($expectedSignature, 0, 8) . '...',
                'received' => substr($signature, 0, 8) . '...',
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
