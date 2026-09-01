<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ItemReadyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $itemName;
    public $tableName;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $itemName, string $tableName = 'Takeaway')
    {
        $this->itemName = $itemName;
        $this->tableName = $tableName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'item_ready',
            'title' => 'Item Ready to Serve!',
            'message' => "{$this->itemName} for {$this->tableName} is ready.",
            'icon' => 'bell',
        ];
    }
}
