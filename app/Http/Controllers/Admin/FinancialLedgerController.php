<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Ledger;
use App\Models\Journal;

class FinancialLedgerController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id', auth()->user()->branch_id);

        $ledgerQuery = Ledger::with(['account', 'journalEntry.journal'])
            ->whereBetween('date', [$startDate, $endDate]);
        
        if ($branchId) {
            $ledgerQuery->where('branch_id', $branchId);
        }

        $ledger = $ledgerQuery->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Map to expected format for professional accounting view
        $ledger->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'date' => $item->date,
                'journal_id' => $item->journalEntry->journal_id,
                'journal_no' => $item->journalEntry->journal->journal_no ?? "LGR-{$item->id}",
                'account_name' => $item->account->name,
                'account_code' => $item->account->code,
                'debit' => $item->debit,
                'credit' => $item->credit,
                'balance' => $item->balance,
                'description' => $item->journalEntry->description,
            ];
        });

        // Summary totals
        $totalDebit = $ledgerQuery->sum('debit');
        $totalCredit = $ledgerQuery->sum('credit');

        return Inertia::render('Admin/Reports/Ledger', [
            'ledger' => $ledger,
            'summary' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'net_flow' => $totalDebit - $totalCredit,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
        ]);
    }

    public function showJournal(Journal $journal)
    {
        $journal->load(['entries.account', 'creator', 'branch']);
        
        return response()->json([
            'journal' => $journal
        ]);
    }

    public function export(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\FinancialLedgerExport($startDate, $endDate),
            'Buku_Besar_' . $startDate . '_sd_' . $endDate . '.xlsx'
        );
    }
}
