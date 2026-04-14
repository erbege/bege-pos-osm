<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OvertimeRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OvertimeRequestController extends Controller
{
    public function index()
    {
        $overtimeRequests = OvertimeRequest::with(['employee', 'approver'])
            ->latest()
            ->take(100)
            ->get();

        $pendingCount = OvertimeRequest::where('status', 'pending')->count();
        $approvedMinutesThisMonth = OvertimeRequest::where('status', 'approved')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('duration_minutes');
        $totalThisMonth = OvertimeRequest::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return Inertia::render('Admin/OvertimeRequests', [
            'overtimeRequests' => $overtimeRequests,
            'employees' => Employee::orderBy('name')->get(),
            'stats' => [
                'pendingCount' => $pendingCount,
                'approvedHoursThisMonth' => round($approvedMinutesThisMonth / 60, 1),
                'totalThisMonth' => $totalThisMonth,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'duration_minutes' => 'required|integer|min:30|max:720',
            'reason' => 'nullable|string|max:500',
        ]);

        OvertimeRequest::create([
            'employee_id' => $data['employee_id'],
            'date' => $data['date'],
            'duration_minutes' => $data['duration_minutes'],
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Overtime request created.');
    }

    public function approve(OvertimeRequest $overtimeRequest)
    {
        if ($overtimeRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requests can be approved.');
        }

        $overtimeRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Overtime request approved.');
    }

    public function reject(OvertimeRequest $overtimeRequest)
    {
        if ($overtimeRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requests can be rejected.');
        }

        $overtimeRequest->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Overtime request rejected.');
    }
}
