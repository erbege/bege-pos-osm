<?php

namespace App\Exports;

use App\Models\Ledger;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinancialLedgerExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected string $startDate;
    protected string $endDate;

    public function __construct(string $startDate, string $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        return Ledger::with(['account', 'journalEntry.journal'])
            ->whereBetween('date', [$this->startDate, $this->endDate])
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    public function headings(): array
    {
        return ['Tanggal', 'Referensi', 'Nomor Jurnal', 'Akun', 'Keterangan', 'Debit', 'Kredit', 'Saldo'];
    }

    public function map($row): array
    {
        return [
            $row->date,
            $row->journalEntry->journal->journal_no ?? "LGR-{$row->id}",
            $row->journalEntry->journal->journal_no ?? '',
            $row->account->name . " ({$row->account->code})",
            $row->journalEntry->description,
            $row->debit,
            $row->credit,
            $row->balance,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
