<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\Employee;
use App\Services\HR\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffAttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {
    }

    public function index()
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return Inertia::render('Staff/MyAttendance', ['employee' => null]);
        }

        $today = today();

        // Today's attendance
        $todayAttendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->with('shift')
            ->first();

        // Today's schedule (to know which shift)
        $todaySchedule = $employee->schedules()
            ->where('date', $today->toDateString())
            ->with('shift')
            ->first();

        // Monthly calendar data
        $month = request('month', now()->month);
        $year = request('year', now()->year);
        $monthlyReport = $this->attendanceService->getMonthlyReport($employee->id, $month, $year);

        // Correction history
        $corrections = AttendanceCorrection::where('employee_id', $employee->id)
            ->with(['attendance', 'approver'])
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Staff/MyAttendance', [
            'employee' => $employee,
            'todayAttendance' => $todayAttendance,
            'todaySchedule' => $todaySchedule,
            'monthlyReport' => $monthlyReport,
            'corrections' => $corrections,
            'month' => (int) $month,
            'year' => (int) $year,
        ]);
    }

    public function clockIn(Request $request)
    {
        $data = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $gps = ($data['latitude'] && $data['longitude'])
            ? ['lat' => $data['latitude'], 'lng' => $data['longitude']]
            : null;

        try {
            $attendance = $this->attendanceService->checkIn($employee, $data['shift_id'], $gps, 'mobile');
            $msg = 'Clock-in berhasil!';
            if ($attendance->status === 'late') {
                $msg .= " (terlambat {$attendance->late_minutes} menit)";
            }
            return redirect()->back()->with('success', $msg);
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function clockOut(Request $request)
    {
        $data = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $gps = ($data['latitude'] && $data['longitude'])
            ? ['lat' => $data['latitude'], 'lng' => $data['longitude']]
            : null;

        try {
            $attendance = $this->attendanceService->checkOut($employee, $gps);
            return redirect()->back()->with('success', "Clock-out berhasil. Jam kerja: {$attendance->work_hours} jam.");
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function requestCorrection(Request $request)
    {
        $data = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'requested_check_in' => 'nullable|date_format:H:i',
            'requested_check_out' => 'nullable|date_format:H:i',
            'reason' => 'required|string|min:10',
        ]);

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        // Verify ownership
        $attendance = Attendance::where('id', $data['attendance_id'])
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        AttendanceCorrection::create([
            'attendance_id' => $data['attendance_id'],
            'employee_id' => $employee->id,
            'requested_check_in' => $data['requested_check_in'] ?? null,
            'requested_check_out' => $data['requested_check_out'] ?? null,
            'reason' => $data['reason'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Permintaan koreksi berhasil diajukan.');
    }
}
