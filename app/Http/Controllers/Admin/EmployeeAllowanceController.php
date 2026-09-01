<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeAllowanceController extends Controller
{
    public function index()
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;

        return Inertia::render('Admin/Allowances', [
            'employees' => Employee::where('branch_id', $branchId)->active()->get(['id', 'name']),
            'allowances' => EmployeeAllowance::with('employee:id,name')
                ->whereHas('employee', fn($q) => $q->where('branch_id', $branchId))
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,per_day,per_attendance',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'effective_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:effective_date',
        ]);

        EmployeeAllowance::create($data);

        return redirect()->back()->with('success', 'Tunjangan berhasil ditambahkan.');
    }

    public function update(Request $request, EmployeeAllowance $employeeAllowance)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,per_day,per_attendance',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'effective_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $employeeAllowance->update($data);

        return redirect()->back()->with('success', 'Tunjangan berhasil diperbarui.');
    }

    public function destroy(EmployeeAllowance $employeeAllowance)
    {
        $employeeAllowance->delete();

        return redirect()->back()->with('success', 'Tunjangan berhasil dihapus.');
    }
}
