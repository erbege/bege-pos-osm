<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        // For Admin to list employees - keeping existing logic if any was there
        // But for mobile staff dashboard, we want the *me* profile
        return $this->profile($request);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)
            ->with(['branch', 'position', 'schedules' => function($q) {
                $q->whereDate('date', '>=', today())->orderBy('date')->take(5);
            }])
            ->first();

        if (!$employee) {
            // Check if it's a customer
            if ($user->hasRole('customer')) {
                return response()->json(['message' => 'You are logged in as a Customer', 'user' => $user->load('customer')], 200);
            }
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        return response()->json([
            'employee' => $employee,
            'user' => $user->load('roles'),
        ]);
    }

    public function leaveRequest(Request $request)
    {
        $request->validate([
            'leave_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
        ]);

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();

        $leave = \App\Models\LeaveRequest::create([
            'branch_id' => $employee->branch_id,
            'employee_id' => $employee->id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Leave request submitted', 'data' => $leave]);
    }

    public function overtimeRequest(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'reason' => 'required|string',
        ]);

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();

        $overtime = \App\Models\OvertimeRequest::create([
            'branch_id' => $employee->branch_id,
            'employee_id' => $employee->id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Overtime request submitted', 'data' => $overtime]);
    }

    public function correctionRequest(Request $request)
    {
        $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'requested_check_in' => 'nullable',
            'requested_check_out' => 'nullable',
            'reason' => 'required|string',
        ]);

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();

        $correction = \App\Models\AttendanceCorrection::create([
            'attendance_id' => $request->attendance_id,
            'employee_id' => $employee->id,
            'requested_check_in' => $request->requested_check_in,
            'requested_check_out' => $request->requested_check_out,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Correction request submitted', 'data' => $correction]);
    }
}
