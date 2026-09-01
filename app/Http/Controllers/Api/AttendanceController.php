<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\HR\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    public function today(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee data not found'], 404);
        }

        $todayAttendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', today()->toDateString())
            ->with(['shift'])
            ->first();

        $todaySchedule = $employee->schedules()
            ->where('date', today()->toDateString())
            ->with('shift')
            ->first();

        return response()->json([
            'attendance' => $todayAttendance,
            'schedule' => $todaySchedule,
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee data not found'], 404);
        }

        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $report = $this->attendanceService->getMonthlyReport($employee->id, $month, $year);

        return response()->json($report);
    }

    public function checkIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'shift_id' => 'required|exists:shifts,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $gps = ($request->latitude && $request->longitude)
            ? ['lat' => $request->latitude, 'lng' => $request->longitude]
            : null;

        try {
            $attendance = $this->attendanceService->checkIn($employee, $request->shift_id, $gps, 'mobile');
            
            return response()->json([
                'message' => 'Clock-in berhasil!',
                'attendance' => $attendance->load('shift'),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function checkOut(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        
        $gps = ($request->latitude && $request->longitude)
            ? ['lat' => $request->latitude, 'lng' => $request->longitude]
            : null;

        try {
            $attendance = $this->attendanceService->checkOut($employee, $gps);
            
            return response()->json([
                'message' => 'Clock-out berhasil!',
                'attendance' => $attendance,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function settings(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee data not found'], 404);
        }

        $settings = \App\Models\AttendanceSetting::where('branch_id', $employee->branch_id)->first();

        return response()->json([
            'radius_meters' => $settings->radius_meters ?? 100,
            'grace_time_minutes' => $settings->grace_time_minutes ?? 0,
            'latitude' => $settings ? (float)$settings->latitude : null,
            'longitude' => $settings ? (float)$settings->longitude : null,
        ]);
    }
}
