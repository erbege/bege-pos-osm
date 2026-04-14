<?php

namespace App\Broadcasting;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteWhatsAppChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        // Check if the notification has a toFonnte method
        if (!method_exists($notification, 'toFonnte')) {
            return;
        }

        // The notification class should return the phone number and message
        $messageData = $notification->toFonnte($notifiable);

        $phone = $messageData['phone'] ?? null;
        $message = $messageData['message'] ?? null;

        if (!$phone || !$message) {
            Log::warning('Fonnte WhatsApp Channel: Missing phone or message payload.', ['data' => $messageData]);
            return;
        }

        $token = env('FONNTE_TOKEN');

        if (!$token) {
            Log::error('Fonnte WhatsApp Channel: FONNTE_TOKEN is not set in .env');
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token
            ])->post('https://api.fonnte.com/send', [
                        'target' => $phone,
                        'message' => $message,
                        'delay' => '2', // Optional delay to prevent spam flagging
                        'countryCode' => '62', // Default to Indonesia
                    ]);

            if ($response->failed()) {
                Log::error('Fonnte WhatsApp API returned an error.', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            } else {
                Log::info('Fonnte WhatsApp successfully dispatched to: ' . $phone);
            }
        } catch (\Exception $e) {
            Log::error('Fonnte WhatsApp Connection Exception: ' . $e->getMessage());
        }
    }
}
