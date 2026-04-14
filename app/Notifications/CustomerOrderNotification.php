<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Broadcasting\FonnteWhatsAppChannel;
use App\Models\Order;

class CustomerOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $order;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Only send WA if they have a phone number (handled in the toFonnte channel check, but we can return the channel class here)
        return [FonnteWhatsAppChannel::class];
    }

    /**
     * Determine the Fonnte Payload. Note: The Customer doesn't formally 'exist' as a User model,
     * so the $notifiable is just a generic object or anonymous Notifiable.
     * We pull the phone from the Order object itself if it was logged in the DB (or you can add a 'customer_phone' column to orders).
     */
    public function toFonnte(object $notifiable): array
    {
        // For demonstration, we assume you might have captured a customer_name/customer_phone on the Order model
        // If it doesn't exist, we fallback.
        $phone = $this->order->customer_phone ?? '08123456789'; // Dummy fallback
        $name = $this->order->customer_name ?? 'Pelanggan Setia';
        $status = ucfirst($this->order->status);
        $total = number_format($this->order->total_amount, 0, ',', '.');
        $id = str_pad($this->order->id, 5, '0', STR_PAD_LEFT);

        $message = "Halo {$name}!\n\n";
        $message .= "Pesanan Anda #{$id} sedang diproses.\n";
        $message .= "Status Saat Ini: *{$status}*\n";
        $message .= "Total Tagihan: Rp {$total}\n\n";
        $message .= "Terima kasih telah berbelanja di BegePOS 🍽️";

        return [
            'phone' => $phone,
            'message' => $message,
        ];
    }
}
