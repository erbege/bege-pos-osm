<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSchedule;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeShiftController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $employee = $user->employee;

        if (!$employee) {
            return redirect()->route('admin.dashboard')->with('error', 'User is not linked to an employee profile.');
        }

        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $startOfWeek = $date->copy()->startOfWeek();
        $endOfWeek = $date->copy()->endOfWeek();

        // Employee's own schedule
        $mySchedules = EmployeeSchedule::with(['shift', 'branch'])
            ->where('employee_id', $employee->id)
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->orderBy('date')
            ->get();

        // Other employees' schedules for the same branch and week (potential swap targets)
        $othersSchedules = EmployeeSchedule::with(['employee', 'shift'])
            ->where('branch_id', $employee->branch_id ?? $user->branch_id)
            ->where('employee_id', '!=', $employee->id)
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->orderBy('date')
            ->get();

        // Swap requests involve the employee
        $mySwaps = ShiftSwap::with(['requester', 'recipient', 'requesterSchedule.shift', 'recipientSchedule.shift'])
            ->where(function($q) use ($employee) {
                $q->where('requester_id', $employee->id)
                  ->orWhere('recipient_id', $employee->id);
            })
            ->latest()
            ->get();

        return Inertia::render('Employee/ShiftSwap', [
            'mySchedules' => $mySchedules,
            'othersSchedules' => $othersSchedules,
            'mySwaps' => $mySwaps,
            'currentDate' => $date->format('Y-m-d'),
            'startOfWeek' => $startOfWeek->format('Y-m-d'),
        ]);
    }

    public function storeSwap(Request $request)
    {
        $validated = $request->validate([
            'my_schedule_id' => 'required|exists:employee_schedules,id',
            'target_schedule_id' => 'required|exists:employee_schedules,id',
            'reason' => 'required|string|max:255',
        ]);

        $employee = auth()->user()->employee;
        
        // Security check: ensure the requester schedule belongs to the auth employee
        $mySched = EmployeeSchedule::where('id', $validated['my_schedule_id'])
            ->where('employee_id', $employee->id)
            ->firstOrFail();

        $targetSched = EmployeeSchedule::findOrFail($validated['target_schedule_id']);

        if ($targetSched->employee_id === $employee->id) {
            return back()->with('error', 'Cannot swap with your own shift.');
        }

        ShiftSwap::create([
            'requester_id' => $employee->id,
            'recipient_id' => $targetSched->employee_id,
            'requester_schedule_id' => $mySched->id,
            'recipient_schedule_id' => $targetSched->id,
            'reason' => $validated['reason'],
            'status' => 'pending'
        ]);

        return back()->with('success', 'Permohonan tukar shift telah dikirim ke admin.');
    }
}
