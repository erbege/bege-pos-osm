<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use App\Services\HR\PayrollEngineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function __construct(
        private PayrollEngineService $payrollEngine
    ) {
    }

    public function index()
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;

        return Inertia::render('Admin/Payroll', [
            'employees' => Employee::where('branch_id', $branchId)
                ->active()
                ->with('position')
                ->get()
                ->map(fn($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'position' => $e->position?->name ?? 'Staff',
                    'pay_type' => $e->pay_type,
                    'pay_type_label' => $e->pay_type_label,
                    'base_salary' => $e->base_salary,
                    'hourly_rate' => $e->hourly_rate,
                    'photo_path' => $e->photo_path,
                    'outstanding_kasbon' => $e->outstanding_cash_advance,
                ]),
            'payrolls' => Payroll::with(['employee.position', 'approver', 'components'])
                ->where(function ($q) use ($branchId) {
                    $q->whereHas('employee', fn($e) => $e->where('branch_id', $branchId));
                })
                ->latest()
                ->take(100)
                ->get(),
            'settings' => \App\Models\AttendanceSetting::where('branch_id', $branchId)->first(),
        ]);
    }

    public function preview(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
            'overtime' => 'nullable|numeric|min:0',
            'deduction' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'cash_advance_deduction' => 'nullable|numeric|min:0',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);

        $preview = $this->payrollEngine->preview($employee, $data['month'], $data['year'], $data);

        return response()->json($preview);
    }

    public function generate(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
            'overtime' => 'nullable|numeric|min:0',
            'deduction' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'cash_advance_deduction' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);

        try {
            $this->payrollEngine->generate($employee, $data['month'], $data['year'], $data);
            return redirect()->back()->with('success', 'Payroll berhasil digenerate.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function bulkGenerate(Request $request)
    {
        $data = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
        ]);

        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;
        $employees = Employee::where('branch_id', $branchId)->active()->get();

        $generated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($employees as $employee) {
            try {
                $this->payrollEngine->generate($employee, $data['month'], $data['year']);
                $generated++;
            } catch (\RuntimeException $e) {
                $skipped++;
                $errors[] = "{$employee->name}: {$e->getMessage()}";
            }
        }

        $msg = "Berhasil: {$generated} payroll. Dilewati: {$skipped}.";
        if (!empty($errors)) {
            $msg .= ' Catatan: ' . implode('; ', array_slice($errors, 0, 5));
        }

        return redirect()->back()->with('success', $msg);
    }

    public function approve(Request $request, Payroll $payroll)
    {
        if ($payroll->status !== 'draft') {
            return redirect()->back()->with('error', 'Payroll bukan draft.');
        }

        $payroll->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Payroll disetujui.');
    }

    public function markPaid(Payroll $payroll)
    {
        if ($payroll->status !== 'approved') {
            return redirect()->back()->with('error', 'Payroll harus disetujui terlebih dahulu.');
        }

        $payroll->loadMissing('employee');

        DB::transaction(function () use ($payroll) {
            $payroll->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Trigger Accounting Event
            event(new \App\Events\PayrollPaid($payroll));
        });

        return redirect()->back()->with('success', 'Payroll ditandai lunas.');
    }

    public function exportSlip(Payroll $payroll)
    {
        $payroll->loadMissing(['employee.position', 'components', 'approver']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.payslip', [
            'payroll' => $payroll,
        ]);

        $filename = "Slip-Gaji-{$payroll->employee->name}-{$payroll->month}-{$payroll->year}.pdf";

        return $pdf->download($filename);
    }
}
