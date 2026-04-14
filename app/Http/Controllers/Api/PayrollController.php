<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee data not found'], 404);
        }

        $payrolls = Payroll::where('employee_id', $employee->id)
            ->whereIn('status', ['approved', 'paid'])
            ->orderBy('period_end', 'desc')
            ->get();

        return response()->json([
            'data' => $payrolls
        ]);
    }

    public function show($id)
    {
        $user = auth()->user();
        $employee = $user->employee;

        $payroll = Payroll::with(['employee.position', 'approver'])
            ->where('id', $id)
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        return response()->json([
            'data' => $payroll
        ]);
    }
}
