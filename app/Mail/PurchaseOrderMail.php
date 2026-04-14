<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchaseOrder;
    public $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct($purchaseOrder, $pdfContent)
    {
        $this->purchaseOrder = $purchaseOrder;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Purchase Order #{$this->purchaseOrder->po_number} - {$this->purchaseOrder->branch->name}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.purchase_order',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(
                fn() => $this->pdfContent,
                "PO-{$this->purchaseOrder->po_number}.pdf",
            )->withMime('application/pdf'),
        ];
    }
}
