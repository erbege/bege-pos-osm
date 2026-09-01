<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $payroll->employee->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #333;
            padding: 30px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .company-info h1 {
            font-size: 18px;
            color: #2563eb;
        }

        .company-info p {
            color: #666;
            font-size: 10px;
        }

        .slip-info {
            text-align: right;
        }

        .slip-info h2 {
            font-size: 14px;
            color: #2563eb;
        }

        .employee-section {
            background: #f8fafc;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
        }

        .employee-section table {
            width: 100%;
        }

        .employee-section td {
            padding: 3px 8px;
        }

        .employee-section td:first-child {
            color: #666;
            width: 140px;
        }

        .component-section {
            margin-bottom: 15px;
        }

        .component-section h3 {
            font-size: 12px;
            color: #2563eb;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }

        .component-table {
            width: 100%;
            border-collapse: collapse;
        }

        .component-table th {
            text-align: left;
            padding: 6px 8px;
            background: #f1f5f9;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
        }

        .component-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
        }

        .component-table .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
        }

        .summary {
            margin-top: 15px;
            border-top: 2px solid #2563eb;
            padding-top: 10px;
        }

        .summary table {
            width: 100%;
        }

        .summary td {
            padding: 4px 8px;
        }

        .summary .label {
            color: #666;
        }

        .summary .value {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }

        .net-salary {
            font-size: 16px;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 8px;
            margin-top: 8px;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            color: #94a3b8;
            font-size: 9px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .badge-salary {
            background: #dbeafe;
            color: #2563eb;
        }

        .badge-hourly {
            background: #dcfce7;
            color: #16a34a;
        }

        .badge-hybrid {
            background: #fef3c7;
            color: #d97706;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="company-info">
            <h1>{{ config('app.name', 'Garasi 66') }}</h1>
            <p>Slip Gaji Karyawan</p>
        </div>
        <div class="slip-info">
            <h2>PAYSLIP</h2>
            <p>Periode: {{ str_pad($payroll->month, 2, '0', STR_PAD_LEFT) }} / {{ $payroll->year }}</p>
            <p>Status:
                @if($payroll->status === 'paid')
                    <span style="color: #16a34a; font-weight: bold;">LUNAS</span>
                @elseif($payroll->status === 'approved')
                    <span style="color: #2563eb; font-weight: bold;">DISETUJUI</span>
                @else
                    <span style="color: #d97706; font-weight: bold;">DRAFT</span>
                @endif
            </p>
        </div>
    </div>

    <div class="employee-section">
        <table>
            <tr>
                <td>Nama Karyawan</td>
                <td><strong>{{ $payroll->employee->name }}</strong></td>
                <td>NIP</td>
                <td>{{ $payroll->employee->nip ?? '-' }}</td>
            </tr>
            <tr>
                <td>Jabatan</td>
                <td>{{ $payroll->employee->position->name ?? 'Staff' }}</td>
                <td>Model Gaji</td>
                <td>
                    @php
                        $payTypeLabels = [
                            'salary_and_hourly' => 'Gaji Pokok + Per Jam',
                            'salary_only' => 'Gaji Pokok',
                            'hourly_only' => 'Per Jam',
                        ];
                    @endphp
                    {{ $payTypeLabels[$payroll->pay_type] ?? $payroll->pay_type }}
                </td>
            </tr>
            <tr>
                <td>Total Jam Kerja</td>
                <td>{{ number_format($payroll->total_hours, 1) }} jam</td>
                <td>Bank</td>
                <td>{{ $payroll->employee->bank_name ?? '-' }} {{ $payroll->employee->bank_account_number ?? '' }}</td>
            </tr>
        </table>
    </div>

    @php
        $earnings = $payroll->components->where('component_type', 'earning');
        $deductions = $payroll->components->where('component_type', 'deduction');
    @endphp

    <div class="component-section">
        <h3>💰 Pendapatan</h3>
        <table class="component-table">
            <thead>
                <tr>
                    <th>Komponen</th>
                    <th style="text-align:right;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                @foreach($earnings as $comp)
                    <tr>
                        <td>{{ $comp->name }}</td>
                        <td class="amount">Rp {{ number_format($comp->amount, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                <tr style="font-weight: bold; border-top: 1px solid #2563eb;">
                    <td>Total Pendapatan</td>
                    <td class="amount">Rp {{ number_format($earnings->sum('amount'), 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    @if($deductions->count() > 0)
        <div class="component-section">
            <h3>📉 Potongan</h3>
            <table class="component-table">
                <thead>
                    <tr>
                        <th>Komponen</th>
                        <th style="text-align:right;">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($deductions as $comp)
                        <tr>
                            <td>{{ $comp->name }}</td>
                            <td class="amount" style="color: #ef4444;">-Rp {{ number_format($comp->amount, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                    <tr style="font-weight: bold; border-top: 1px solid #ef4444;">
                        <td>Total Potongan</td>
                        <td class="amount" style="color: #ef4444;">-Rp
                            {{ number_format($deductions->sum('amount'), 0, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endif

    <div class="summary">
        <div class="net-salary">
            <table>
                <tr>
                    <td style="font-size: 14px; font-weight: bold;">GAJI BERSIH (Take Home Pay)</td>
                    <td style="text-align: right; font-size: 18px; font-weight: bold; color: #2563eb;">
                        Rp {{ number_format($payroll->net_salary, 0, ',', '.') }}
                    </td>
                </tr>
            </table>
        </div>
    </div>

    @if($payroll->approver)
        <div style="margin-top: 20px; text-align: right;">
            <p style="color: #666; font-size: 10px;">
                Disetujui oleh: {{ $payroll->approver->name }}<br>
                Tanggal: {{ $payroll->approved_at?->format('d/m/Y H:i') ?? '-' }}
            </p>
        </div>
    @endif

    <div class="footer">
        <p>Dokumen ini dibuat secara otomatis oleh sistem {{ config('app.name', 'Garasi 66') }} dan tidak memerlukan
            tanda tangan.</p>
        <p>Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}</p>
    </div>
</body>

</html>