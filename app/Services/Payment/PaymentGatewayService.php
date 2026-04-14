<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Support\Str;
use App\Services\Payment\Gateways\PaymentGatewayInterface;
use App\Services\Payment\Gateways\IpaymuGateway;
use App\Services\Payment\Gateways\TripayGateway;
use App\Services\Payment\Gateways\MidtransGateway;
use App\Services\Payment\Gateways\XenditGateway;

class PaymentGatewayService
{
    /**
     * Resolve the active Payment Gateway strategy based on Admin Settings, 
     * and request an actual QRIS transaction url for the frontend.
     * 
     * @param Payment $payment
     * @return array Returns ['qr_url' => string, 'gateway_reference' => string|null]
     * @throws \Exception
     */
    public function generateQR(Payment $payment): array
    {
        $provider = strtolower(trim(Setting::getValue('payment_gateway', 'active_provider', '')));

        if (!$provider) {
            throw new \Exception('No payment provider configured in settings.');
        }

        $gateway = $this->resolveGateway($provider);

        // Fetch the QR payload directly from the 3rd-party Gateway API
        return $gateway->requestQRTransaction($payment);
    }

    /**
     * Resolve the active Payment Gateway strategy based on Admin Settings, 
     * and request a Virtual Account for the frontend.
     * 
     * @param Payment $payment
     * @return array Returns ['virtual_account' => string, 'gateway_reference' => string|null, 'expired_at' => string|null]
     * @throws \Exception
     */
    public function generateVA(Payment $payment): array
    {
        $provider = strtolower(trim(Setting::getValue('payment_gateway', 'active_provider', '')));

        if (!$provider) {
            throw new \Exception('No payment provider configured in settings.');
        }

        $gateway = $this->resolveGateway($provider);

        return $gateway->requestVATransaction($payment);
    }

    /**
     * Factory pattern to resolve the correct Gateway concrete class.
     * 
     * @param string $provider
     * @return PaymentGatewayInterface
     * @throws \Exception
     */
    private function resolveGateway(string $provider): PaymentGatewayInterface
    {
        return match ($provider) {
            'ipaymu' => new IpaymuGateway(),
            'tripay' => new TripayGateway(),
            'midtrans' => new MidtransGateway(),
            'xendit' => new XenditGateway(),
            default => throw new \Exception("Unsupported payment provider configured: {$provider}"),
        };
    }

    /**
     * Helper to get provider-specific setting.
     */
    public static function getProviderSetting(string $provider, string $key, $default = null)
    {
        return Setting::getValue('payment_gateway', "{$provider}_{$key}", $default);
    }
}
