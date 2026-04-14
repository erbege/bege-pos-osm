<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyReportNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $reportDate;
    public $totalRevenue;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $reportDate, float $totalRevenue)
    {
        $this->reportDate = $reportDate;
        $this->totalRevenue = $totalRevenue;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $formattedRevenue = number_format($this->totalRevenue, 0, ',', '.');

        return (new MailMessage)
            ->subject("Daily Sales Report - {$this->reportDate}")
            ->greeting("Hello, Manager!")
            ->line('Here is your daily performance summary for BegePOS.')
            ->line("**Date:** {$this->reportDate}")
            ->line("**Total Revenue:** Rp {$formattedRevenue}")
            ->action('View Full Report in Dashboard', url('/admin/dashboard'))
            ->line('Keep up the great work!')
            ->success();
    }
}
