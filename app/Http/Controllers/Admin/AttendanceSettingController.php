<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSetting;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceSettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/AttendanceSettings', [
            'settings' => AttendanceSetting::with('branch')->get(),
            'branches' => Branch::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'grace_time_minutes' => 'required|integer|min:0|max:120',
            'late_penalty_per_minute' => 'required|numeric|min:0',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:5000',
        ]);

        // Upsert: one setting per branch (or global if branch_id is null)
        AttendanceSetting::updateOrCreate(
            ['branch_id' => $data['branch_id']],
            $data
        );

        return redirect()->back()->with('success', 'Attendance settings saved.');
    }

    public function destroy(AttendanceSetting $attendanceSetting)
    {
        $attendanceSetting->delete();

        return redirect()->back()->with('success', 'Setting deleted.');
    }
}
