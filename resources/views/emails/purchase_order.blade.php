# Purchase Order #{{ $purchaseOrder->po_number }}

Hello {{ $purchaseOrder->supplier->name }},

Please find attached the Purchase Order #{{ $purchaseOrder->po_number }} from **{{ $purchaseOrder->branch->name }}**.

**Order Summary:**
- **Date:** {{ $purchaseOrder->created_at->format('d M Y') }}
- **Total Amount:** Rp {{ number_format($purchaseOrder->total_amount, 0, ',', '.') }}
- **Notes:** {{ $purchaseOrder->notes ?? 'N/A' }}

Please confirm receipt of this order and let us know the estimated delivery date.

Thanks,<br>
{{ $purchaseOrder->creator->name }}<br>
{{ $purchaseOrder->branch->name }}