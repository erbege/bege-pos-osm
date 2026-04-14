<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;

class InventoryLedgerExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected Collection $movements;

    public function __construct(Collection $movements)
    {
        $this->movements = $movements;
    }

    public function collection()
    {
        return $this->movements;
    }

    public function headings(): array
    {
        return [
            'Waktu',
            'Material',
            'SKU',
            'Tipe',
            'Kuantitas',
            'Satuan',
            'Biaya Satuan',
            'Total Nilai',
            'Referensi',
            'Catatan',
            'Oleh'
        ];
    }

    public function map($m): array
    {
        return [
            $m->created_at->toDateTimeString(),
            $m->material->name ?? '-',
            $m->material->sku ?? '-',
            $m->type_label,
            $m->qty,
            $m->material->unit ?? '',
            $m->cost,
            $m->value,
            $m->reference_type ? class_basename($m->reference_type) . " #{$m->reference_id}" : '-',
            $m->notes,
            $m->creator->name ?? 'System',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
