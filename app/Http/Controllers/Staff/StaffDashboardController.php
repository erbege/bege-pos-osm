<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\ShiftSwap;
use App\Models\LeaveRequest;
use App\Models\AttendanceCorrection;
use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->with('position')->first();

        if (!$employee) {
            return Inertia::render('Staff/Dashboard', ['employee' => null]);
        }

        $today = today();

        // Today's attendance
        $todayAttendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->with('shift')
            ->first();

        // Today's schedule
        $todaySchedule = $employee->schedules()
            ->where('date', $today->toDateString())
            ->with('shift')
            ->first();

        // Monthly stats
        $monthStart = now()->startOfMonth();
        $monthAttendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$monthStart, $today])
            ->get();

        $monthlyStats = [
            'present_days' => $monthAttendances->where('is_absent', false)->count(),
            'late_days' => $monthAttendances->where('status', 'late')->count(),
            'total_hours' => round($monthAttendances->sum('work_hours'), 1),
        ];

        // Latest payslip
        $latestPayslip = Payroll::where('employee_id', $employee->id)
            ->where('status', 'paid')
            ->latest()
            ->first();

        // Pending requests
        $pendingRequests = [
            'leave' => LeaveRequest::where('employee_id', $employee->id)->where('status', 'pending')->count(),
            'correction' => AttendanceCorrection::where('employee_id', $employee->id)->where('status', 'pending')->count(),
            'swap' => ShiftSwap::where('requester_id', $employee->id)->where('status', 'pending')->count(),
        ];

        return Inertia::render('Staff/Dashboard', [
            'employee' => $employee,
            'todayAttendance' => $todayAttendance,
            'todaySchedule' => $todaySchedule,
            'monthlyStats' => $monthlyStats,
            'latestPayslip' => $latestPayslip,
            'pendingRequests' => $pendingRequests,
        ]);
    }
}
