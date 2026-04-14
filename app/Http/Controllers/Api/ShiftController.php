<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeSchedule;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['data' => []]);
        }

        // Fetch schedules for the next 7 days
        $schedules = EmployeeSchedule::with('shift')
            ->where('employee_id', $employee->id)
            ->where('date', '>=', now()->toDateString())
            ->where('date', '<=', now()->addDays(7)->toDateString())
            ->orderBy('date')
            ->get();

        return response()->json([
            'data' => $schedules
        ]);
    }

    public function history()
    {
        $user = auth()->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['data' => []]);
        }

        // Fetch past schedules for the last 30 days
        $history = EmployeeSchedule::with('shift')
            ->where('employee_id', $employee->id)
            ->where('date', '<', now()->toDateString())
            ->where('date', '>=', now()->subDays(30)->toDateString())
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'data' => $history
        ]);
    }

    public function swapRequest(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|exists:employee_schedules,id',
            'recipient_id' => 'required|exists:employees,id',
            'reason' => 'nullable|string',
        ]);

        $user = auth()->user();
        $employee = $user->employee;

        // Ensure the schedule belongs to the authenticated employee
        $schedule = EmployeeSchedule::where('id', $request->schedule_id)
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        $swap = ShiftSwap::create([
            'branch_id' => $employee->branch_id,
            'requester_id' => $employee->id,
            'recipient_id' => $request->recipient_id,
            'schedule_id' => $request->schedule_id,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Shift swap request sent',
            'data' => $swap
        ]);
    }
}
