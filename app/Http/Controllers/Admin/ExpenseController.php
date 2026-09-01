<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::latest('date')->latest('id')->paginate(15);
        $accounts = \App\Models\Account::where('type', 'expense')->orderBy('code')->get();

        return Inertia::render('Admin/Expenses', [
            'expenses' => $expenses,
            'accounts' => $accounts
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date'
        ]);

        $validated['user_id'] = Auth::id();
        $validated['branch_id'] = Auth::user()->branch_id;

        $expense = Expense::create($validated);

        // Trigger Accounting Event
        event(new \App\Events\ManualEntryRecorded('expense', $expense->amount, $expense, $expense->branch_id, $expense->description));

        return redirect()->back()->with('success', 'Pengeluaran operasional berhasil dicatat.');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date'
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Pengeluaran operasional berhasil diubah.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Pengeluaran operasional berhasil dihapus.');
    }
}
