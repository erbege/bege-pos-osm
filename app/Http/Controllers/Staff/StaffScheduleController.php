<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\LeaveRequest;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffScheduleController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return Inertia::render('Staff/MySchedule', ['employee' => null]);
        }

        // Current week + next 2 weeks schedules
        $startDate = now()->startOfWeek();
        $endDate = now()->addWeeks(2)->endOfWeek();

        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with('shift')
            ->orderBy('date')
            ->get();

        // Swap requests (sent and received)
        $swapRequests = ShiftSwap::where('requester_id', $employee->id)
            ->orWhere('recipient_id', $employee->id)
            ->with(['requester:id,name', 'recipient:id,name', 'requesterSchedule.shift', 'recipientSchedule.shift', 'approver'])
            ->latest()
            ->take(10)
            ->get();

        // Leave requests
        $leaveRequests = LeaveRequest::where('employee_id', $employee->id)
            ->with('approver')
            ->latest()
            ->take(10)
            ->get();

        // Available colleagues for swap (same branch)
        $colleagues = Employee::where('branch_id', $employee->branch_id)
            ->where('id', '!=', $employee->id)
            ->active()
            ->get(['id', 'name']);

        return Inertia::render('Staff/MySchedule', [
            'employee' => $employee,
            'schedules' => $schedules,
            'swapRequests' => $swapRequests,
            'leaveRequests' => $leaveRequests,
            'colleagues' => $colleagues,
        ]);
    }

    public function requestSwap(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|exists:employees,id',
            'requester_schedule_id' => 'required|exists:employee_schedules,id',
            'recipient_schedule_id' => 'required|exists:employee_schedules,id',
            'reason' => 'required|string|min:5',
        ]);

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        // Verify ownership of requester schedule
        $schedule = EmployeeSchedule::where('id', $data['requester_schedule_id'])
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        ShiftSwap::create([
            'requester_id' => $employee->id,
            'recipient_id' => $data['recipient_id'],
            'requester_schedule_id' => $data['requester_schedule_id'],
            'recipient_schedule_id' => $data['recipient_schedule_id'],
            'reason' => $data['reason'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Permintaan tukar shift berhasil diajukan.');
    }

    public function requestLeave(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:annual,sick,personal,unpaid',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|min:5',
        ]);

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        LeaveRequest::create([
            'employee_id' => $employee->id,
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'reason' => $data['reason'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Pengajuan cuti berhasil dikirim.');
    }
}
