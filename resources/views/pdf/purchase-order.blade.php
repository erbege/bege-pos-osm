<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Purchase Order {{ $po->po_number }}</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 12px;
            color: #333;
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            margin: 0;
            color: #4f46e5;
        }

        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-bottom: 10px;
            color: #666;
            font-size: 10px;
        }

        .grid {
            width: 100%;
        }

        .grid td {
            vertical-align: top;
            width: 50%;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        table.items th {
            background: #f9fafb;
            border-bottom: 2px solid #eee;
            padding: 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
        }

        table.items td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .total-row {
            font-weight: bold;
            background: #fef2f2;
        }

        .footer {
            margin-top: 50px;
            text-align: center;
            color: #999;
            font-size: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>PURCHASE ORDER</h1>
        <p>#{{ $po->po_number }}</p>
    </div>

    <table class="grid">
        <tr>
            <td>
                <div class="section">
                    <div class="section-title">Supplier</div>
                    <strong>{{ $po->supplier->name }}</strong><br>
                    {{ $po->supplier->email }}<br>
                    Termin: {{ $po->supplier->payment_terms }}
                </div>
            </td>
            <td>
                <div class="section">
                    <div class="section-title">Shipping To</div>
                    <strong>{{ $po->branch->name }}</strong><br>
                    {{ $po->branch->address }}
                </div>
            </td>
        </tr>
    </table>

    <div class="section" style="margin-top: 20px;">
        <div class="section-title">Order Info</div>
        <table class="grid">
            <tr>
                <td>Date: {{ $po->created_at->format('d M Y') }}</td>
                <td>Status: {{ strtoupper($po->status) }}</td>
            </tr>
        </table>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Material</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Cost</th>
                <th style="text-align: right;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($po->items as $item)
                <tr>
                    <td>{{ $item->material->name }}</td>
                    <td style="text-align: center;">{{ number_format($item->qty) }} {{ $item->material->unit }}</td>
                    <td style="text-align: right;">Rp {{ number_format($item->unit_cost, 0, ',', '.') }}</td>
                    <td style="text-align: right;">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="3" style="text-align: right; padding: 15px;">GRAND TOTAL</td>
                <td style="text-align: right; padding: 15px;">Rp {{ number_format($po->total_amount, 0, ',', '.') }}
                </td>
            </tr>
        </tfoot>
    </table>

    @if($po->notes)
        <div class="section" style="margin-top: 30px;">
            <div class="section-title">Notes</div>
            <p>{{ $po->notes }}</p>
        </div>
    @endif

    <div class="footer">
        Generated on {{ now()->format('d M Y H:i') }}
    </div>
</body>

</html>