<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceCorrectionController extends Controller
{
    public function index()
    {
        $corrections = AttendanceCorrection::with(['employee', 'attendance', 'approver'])
            ->latest()
            ->take(100)
            ->get();

        $pendingCount = AttendanceCorrection::where('status', 'pending')->count();
        $approvedThisMonth = AttendanceCorrection::where('status', 'approved')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();
        $totalThisMonth = AttendanceCorrection::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return Inertia::render('Admin/AttendanceCorrections', [
            'corrections' => $corrections,
            'employees' => Employee::orderBy('name')->get(),
            'attendances' => Attendance::with('employee')
                ->latest()
                ->take(200)
                ->get(),
            'stats' => [
                'pendingCount' => $pendingCount,
                'approvedThisMonth' => $approvedThisMonth,
                'totalThisMonth' => $totalThisMonth,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'employee_id' => 'required|exists:employees,id',
            'requested_check_in' => 'nullable|date',
            'requested_check_out' => 'nullable|date',
            'reason' => 'nullable|string|max:500',
        ]);

        AttendanceCorrection::create([
            'attendance_id' => $data['attendance_id'],
            'employee_id' => $data['employee_id'],
            'requested_check_in' => $data['requested_check_in'] ?? null,
            'requested_check_out' => $data['requested_check_out'] ?? null,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Correction request submitted.');
    }

    public function approve(AttendanceCorrection $correction)
    {
        if ($correction->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending corrections can be approved.');
        }

        $correction->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
        ]);

        // Apply the correction to the attendance record
        $attendance = $correction->attendance;
        if ($correction->requested_check_in) {
            $attendance->check_in = $correction->requested_check_in->format('H:i:s');
        }
        if ($correction->requested_check_out) {
            $attendance->check_out = $correction->requested_check_out->format('H:i:s');
        }
        $attendance->save();

        return redirect()->back()->with('success', 'Correction approved and attendance updated.');
    }

    public function reject(AttendanceCorrection $correction)
    {
        if ($correction->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending corrections can be rejected.');
        }

        $correction->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Correction rejected.');
    }
}
