<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashAdvanceController extends Controller
{
    public function index()
    {
        $cashAdvances = CashAdvance::with(['employee', 'approver'])
            ->latest()
            ->take(100)
            ->get()
            ->each->append('remaining');

        $totalOutstanding = CashAdvance::outstanding()->sum(DB::raw('amount - repaid_amount'));
        $pendingCount = CashAdvance::pending()->count();
        $paidThisMonth = CashAdvance::where('status', 'approved')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('repaid_amount');

        return Inertia::render('Admin/CashAdvances', [
            'cashAdvances' => $cashAdvances,
            'employees' => Employee::orderBy('name')->get(),
            'stats' => [
                'totalOutstanding' => $totalOutstanding,
                'pendingCount' => $pendingCount,
                'paidThisMonth' => $paidThisMonth,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:1000',
            'reason' => 'nullable|string|max:500',
            'due_date' => 'nullable|date|after:today',
        ]);

        CashAdvance::create([
            'employee_id' => $data['employee_id'],
            'amount' => $data['amount'],
            'reason' => $data['reason'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Kasbon request created.');
    }

    public function approve(CashAdvance $cashAdvance)
    {
        if ($cashAdvance->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requests can be approved.');
        }

        $cashAdvance->loadMissing('employee');

        DB::transaction(function () use ($cashAdvance) {
            $cashAdvance->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            Transaction::create([
                'type' => 'expense',
                'amount' => $cashAdvance->amount,
                'description' => "Kasbon: {$cashAdvance->employee->name} — {$cashAdvance->reason}",
                'date' => now(),
                'branch_id' => $cashAdvance->employee->branch_id,
            ]);
        });

        return redirect()->back()->with('success', 'Kasbon approved and recorded as expense.');
    }

    public function reject(CashAdvance $cashAdvance)
    {
        if ($cashAdvance->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requests can be rejected.');
        }

        $cashAdvance->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kasbon rejected.');
    }

    public function repay(Request $request, CashAdvance $cashAdvance)
    {
        if ($cashAdvance->status !== 'approved') {
            return redirect()->back()->with('error', 'Only approved kasbon can be repaid.');
        }

        $remaining = $cashAdvance->amount - $cashAdvance->repaid_amount;

        $data = $request->validate([
            'repay_amount' => "required|numeric|min:1000|max:{$remaining}",
            'notes' => 'nullable|string|max:500',
        ]);

        $cashAdvance->loadMissing('employee');

        DB::transaction(function () use ($cashAdvance, $data, $remaining) {
            $newRepaid = $cashAdvance->repaid_amount + $data['repay_amount'];
            $isFullyPaid = $newRepaid >= $cashAdvance->amount;

            $cashAdvance->update([
                'repaid_amount' => $newRepaid,
                'status' => $isFullyPaid ? 'repaid' : 'approved',
                'notes' => $data['notes'] ?? $cashAdvance->notes,
            ]);

            Transaction::create([
                'type' => 'income',
                'amount' => $data['repay_amount'],
                'description' => "Kasbon Repayment: {$cashAdvance->employee->name}",
                'date' => now(),
                'branch_id' => $cashAdvance->employee->branch_id,
            ]);
        });

        return redirect()->back()->with('success', 'Repayment recorded.');
    }
}
