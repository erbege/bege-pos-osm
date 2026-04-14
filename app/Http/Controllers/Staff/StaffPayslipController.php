<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use Inertia\Inertia;

class StaffPayslipController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return Inertia::render('Staff/MyPayslip', ['employee' => null, 'payslips' => []]);
        }

        $payslips = Payroll::where('employee_id', $employee->id)
            ->whereIn('status', ['approved', 'paid'])
            ->with('components')
            ->latest()
            ->paginate(12);

        return Inertia::render('Staff/MyPayslip', [
            'employee' => $employee,
            'payslips' => $payslips,
        ]);
    }

    public function show(Payroll $payroll)
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        // Ensure staff can only see their own payslips
        if ($payroll->employee_id !== $employee->id) {
            abort(403);
        }

        $payroll->loadMissing(['components', 'employee.position', 'approver']);

        return response()->json($payroll);
    }

    public function downloadPdf(Payroll $payroll)
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        if ($payroll->employee_id !== $employee->id) {
            abort(403);
        }

        $payroll->loadMissing(['employee.position', 'components', 'approver']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.payslip', [
            'payroll' => $payroll,
        ]);

        $filename = "Slip-Gaji-{$payroll->employee->name}-{$payroll->month}-{$payroll->year}.pdf";

        return $pdf->download($filename);
    }
}
