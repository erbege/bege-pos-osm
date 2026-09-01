<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\HR\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {
    }

    public function index(Request $request)
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;

        $today = today();
        $startOfMonth = now()->startOfMonth();

        // 1. Current Attendances (Today)
        $attendances = Attendance::with(['employee', 'shift'])
            ->whereDate('date', $today)
            ->where('branch_id', $branchId)
            ->latest()
            ->get();

        // 2. Insights
        $totalEmployees = Employee::where('branch_id', $branchId)->active()->count();
        $presentToday = $attendances->where('is_absent', false)->count();
        $lateToday = $attendances->where('status', 'late')->count();
        $absentToday = $attendances->where('is_absent', true)->count();
        $onTimeToday = $presentToday - $lateToday;
        $onTimeRate = $presentToday > 0 ? round(($onTimeToday / $presentToday) * 100) : 0;

        $insights = [
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'late_today' => $lateToday,
            'absent_today' => max(0, $totalEmployees - $presentToday) + $absentToday,
            'on_time_rate' => $onTimeRate,
        ];

        // 3. Leaderboard (This Month - Top On-Time Employees)
        $leaderboard = Attendance::query()
            ->select('employee_id', \DB::raw('count(*) as total_present'), \DB::raw('sum(case when status = "present" then 1 else 0 end) as on_time_count'))
            ->where('branch_id', $branchId)
            ->where('is_absent', false)
            ->whereBetween('date', [$startOfMonth, $today])
            ->groupBy('employee_id')
            ->with('employee:id,name,photo_path')
            ->get()
            ->map(function ($item) {
                $item->on_time_percentage = $item->total_present > 0 ? round(($item->on_time_count / $item->total_present) * 100) : 0;
                return $item;
            })
            ->sortByDesc('on_time_percentage')
            ->values()
            ->take(5);

        // 4. Recent History (Last 30 days, paginated)
        $history = Attendance::with(['employee', 'shift'])
            ->where('branch_id', $branchId)
            ->latest('date')
            ->latest('check_in')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Attendance', [
            'employees' => Employee::where('branch_id', $branchId)->active()->get(),
            'shifts' => \App\Models\Shift::where('branch_id', $branchId)->get(),
            'attendances' => $attendances,
            'insights' => $insights,
            'leaderboard' => $leaderboard,
            'history' => $history,
            'settings' => \App\Models\AttendanceSetting::where('branch_id', $branchId)->first(),
        ]);
    }

    public function checkIn(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_id' => 'required|exists:shifts,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);
        $gps = ($data['latitude'] && $data['longitude'])
            ? ['lat' => $data['latitude'], 'lng' => $data['longitude']]
            : null;

        try {
            $attendance = $this->attendanceService->checkIn($employee, $data['shift_id'], $gps, 'web');
            $msg = 'Check-in berhasil';
            if ($attendance->status === 'late') {
                $msg .= " (terlambat {$attendance->late_minutes} menit)";
            }
            return redirect()->back()->with('success', $msg . '.');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function checkOut(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);
        $gps = ($data['latitude'] && $data['longitude'])
            ? ['lat' => $data['latitude'], 'lng' => $data['longitude']]
            : null;

        try {
            $attendance = $this->attendanceService->checkOut($employee, $gps);
            return redirect()->back()->with('success', "Check-out berhasil. Jam kerja: {$attendance->work_hours} jam.");
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function markAbsent(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'absence_type' => 'required|in:alpha,sick,permit,leave',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);

        $this->attendanceService->markAbsent($employee, $data['absence_type'], $data['date'], $data['notes'] ?? null);

        return redirect()->back()->with('success', 'Absensi berhasil dicatat.');
    }

    public function calendarView(Request $request)
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $employees = Employee::where('branch_id', $branchId)->active()->get();

        $calendarData = $employees->map(function ($employee) use ($month, $year) {
            $report = $this->attendanceService->getMonthlyReport($employee->id, $month, $year);
            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'photo_path' => $employee->photo_path,
                'attendances' => $report['attendances'],
                'summary' => $report['summary'],
            ];
        });

        return response()->json([
            'calendar_data' => $calendarData,
            'month' => $month,
            'year' => $year,
        ]);
    }
}
