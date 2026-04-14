<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ledger;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // 1. P&L Summary using new Ledger and Account types
        // Revenue accounts
        $totalIncome = Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('type', 'revenue'))
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('credit');

        // Expense accounts (COGS, Salary, Operational)
        $expenseOperational = Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('type', 'expense')->where('code', '!=', '5200')) // Not Salary
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('debit');

        $expensePayroll = Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('code', '5200')) // Salary Expense
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('debit');

        $totalExpense = $expenseOperational + $expensePayroll;
        $netProfit = $totalIncome - $totalExpense;

        // 2. Recent Transactions (Ledger records)
        $recentTransactions = Ledger::with(['account', 'journalEntry.journal'])
            ->where('branch_id', $branchId)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function ($l) {
                return [
                    'id' => $l->id,
                    'date' => $l->date,
                    'type' => $l->debit > 0 ? 'expense' : 'income',
                    'amount' => $l->debit > 0 ? $l->debit : $l->credit,
                    'description' => $l->account->name . ($l->journalEntry->description ? ' - ' . $l->journalEntry->description : ''),
                    'source' => 'ledger'
                ];
            });

        // 3. Daily Trend for Chart
        $dailyData = Ledger::where('branch_id', $branchId)
            ->whereBetween('date', [$startDate, $endDate])
            ->select(
                'date',
                DB::raw("SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as expense"),
                DB::raw("SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as income")
            )
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $dailyTrend = collect();
        for ($i = 1; $i <= $startDate->daysInMonth; $i++) {
            $dateStr = $startDate->copy()->addDays($i - 1)->format('Y-m-d');
            $data = $dailyData->get($dateStr);
            
            $dailyTrend->push([
                'date' => Carbon::parse($dateStr)->format('d M'),
                'income' => $data ? (float) $data->income : 0,
                'expense' => $data ? (float) $data->expense : 0,
            ]);
        }

        // 4. Monthly Summary (Last 12 months)
        $monthlySummary = Ledger::where('branch_id', $branchId)
            ->select(
                DB::raw("DATE_FORMAT(date, '%Y-%m') as period"),
                DB::raw("SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as income"),
                DB::raw("SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as expense")
            )
            ->groupBy('period')
            ->orderByDesc('period')
            ->limit(12)
            ->get()
            ->keyBy('period')
            ->map(fn($row) => [
                'income' => (float) $row->income,
                'expense' => (float) $row->expense,
            ]);

        return Inertia::render('Admin/Finance', [
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'expenseOperational' => $expenseOperational,
            'expensePayroll' => $expensePayroll,
            'netProfit' => $netProfit,
            'transactions' => $recentTransactions,
            'monthlySummary' => $monthlySummary,
            'dailyTrend' => $dailyTrend,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
            ],
        ]);
    }

    public function coa()
    {
        // Use a subquery to get the latest ledger ID for each account
        $latestLedgerIds = Ledger::select(DB::raw('MAX(id) as id'))
            ->groupBy('account_id');

        $balances = Ledger::whereIn('id', $latestLedgerIds)
            ->pluck('balance', 'account_id');

        $accounts = Account::orderBy('code')->get()->map(function($account) use ($balances) {
            $account->balance = $balances[$account->id] ?? 0;
            return $account;
        });

        return Inertia::render('Admin/Accounting/COA', [
            'accounts' => $accounts
        ]);
    }

    public function periods()
    {
        $periods = \App\Models\FinancialPeriod::orderBy('start_date', 'desc')->get();

        return Inertia::render('Admin/Accounting/Periods', [
            'periods' => $periods
        ]);
    }

    public function storePeriod(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        \App\Models\FinancialPeriod::create($validated);

        return back()->with('success', 'Financial period created.');
    }

    public function closePeriod(\App\Models\FinancialPeriod $period)
    {
        $period->update(['status' => 'closed']);
        return back()->with('success', 'Financial period closed. No more journals can be posted to this period.');
    }
}
