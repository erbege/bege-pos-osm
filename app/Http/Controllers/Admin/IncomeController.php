<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Income;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class IncomeController extends Controller
{
    public function index()
    {
        $incomes = Income::latest('date')->latest('id')->paginate(15);
        $accounts = \App\Models\Account::where('type', 'revenue')->orderBy('code')->get();

        return Inertia::render('Admin/Incomes', [
            'incomes' => $incomes,
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

        $income = Income::create($validated);

        // Trigger Accounting Event
        event(new \App\Events\ManualEntryRecorded('income', $income->amount, $income, $income->branch_id, $income->description));

        return redirect()->back()->with('success', 'Pemasukan berhasil dicatat.');
    }

    public function update(Request $request, Income $income)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date'
        ]);

        $income->update($validated);

        return redirect()->back()->with('success', 'Pemasukan berhasil diubah.');
    }

    public function destroy(Income $income)
    {
        $income->delete();

        return redirect()->back()->with('success', 'Pemasukan berhasil dihapus.');
    }
}
