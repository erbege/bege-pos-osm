<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Shift;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ShiftManagementController extends Controller
{
    public function index(Request $request)
    {
        $branchId = session('active_branch_id') ?? auth()->user()->branch_id;
        
        if (!$branchId) {
            $branchId = \App\Models\Branch::first()?->id;
        }

        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $shiftId = $request->shift_id;
        
        $startOfWeek = $date->copy()->startOfWeek();
        $endOfWeek = $date->copy()->endOfWeek();
        
        $schedules = EmployeeSchedule::with(['employee:id,name,position_id', 'shift'])
            ->where('branch_id', $branchId)
            ->whereBetween('date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->when($shiftId, fn($q) => $q->where('shift_id', $shiftId))
            ->get();

        $isOwner = auth()->user()->hasRole('owner') || auth()->user()->hasRole('Admin');
        
        $employees = Employee::when($isOwner, fn($q) => $q->withoutGlobalScopes())
            ->where('branch_id', $branchId)
            ->with('position')
            ->orderBy('name')
            ->get();

        $currentUserEmployee = Employee::where('user_id', auth()->id())->first();

        $shifts = Shift::where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            })
            ->where('is_active', true)
            ->get();
        
        $swapsQuery = ShiftSwap::whereHas('requesterSchedule', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            })
            ->with(['requester', 'recipient', 'requesterSchedule.shift', 'recipientSchedule.shift']);

        if ($isOwner) {
            $swaps = $swapsQuery->whereIn('status', ['waiting_recipient', 'pending'])->latest()->get();
        } else if ($currentUserEmployee) {
            $swaps = $swapsQuery->where(function($q) use ($currentUserEmployee) {
                $q->where('requester_id', $currentUserEmployee->id)
                  ->orWhere('recipient_id', $currentUserEmployee->id);
            })->whereIn('status', ['waiting_recipient', 'pending'])->latest()->get();
        } else {
            $swaps = collect();
        }

        return Inertia::render('Admin/ShiftManagement', [
            'schedules' => $schedules,
            'employees' => $employees,
            'shifts' => $shifts,
            'swaps' => $swaps,
            'currentUserEmployeeId' => $currentUserEmployee?->id,
            'currentDate' => $date->format('Y-m-d'),
            'startOfWeek' => $startOfWeek->format('Y-m-d'),
        ]);
    }

    public function storeSchedule(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_id' => 'required|exists:shifts,id',
            'date' => 'required|date',
            'role_note' => 'nullable|string|max:100',
        ]);

        $branchId = session('active_branch_id') ?? auth()->user()->branch_id;
        if (!$branchId) {
            $branchId = \App\Models\Branch::first()?->id;
        }

        EmployeeSchedule::withoutGlobalScopes()->updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            [
                'shift_id' => $validated['shift_id'],
                'branch_id' => $branchId,
                'role_note' => $validated['role_note']
            ]
        );

        return back()->with('success', 'Schedule updated.');
    }

    public function requestSwap(Request $request)
    {
        $validated = $request->validate([
            'requester_schedule_id' => 'required|exists:employee_schedules,id',
            'recipient_schedule_id' => 'required|exists:employee_schedules,id',
            'reason' => 'nullable|string',
        ]);

        $reqSchedule = EmployeeSchedule::with('employee')->findOrFail($validated['requester_schedule_id']);
        $recSchedule = EmployeeSchedule::with('employee')->findOrFail($validated['recipient_schedule_id']);

        if ($reqSchedule->employee->position_id !== $recSchedule->employee->position_id) {
            return back()->withErrors(['recipient_schedule_id' => 'Pertukaran shift hanya diperbolehkan antar karyawan dengan posisi yang sama.']);
        }

        ShiftSwap::create([
            'requester_id' => $reqSchedule->employee_id,
            'recipient_id' => $recSchedule->employee_id,
            'requester_schedule_id' => $reqSchedule->id,
            'recipient_schedule_id' => $recSchedule->id,
            'reason' => $validated['reason'],
            'status' => 'waiting_recipient'
        ]);

        return back()->with('success', 'Permohonan tukar shift telah dikirim ke rekan Anda untuk disetujui.');
    }

    public function acceptSwapByRecipient(ShiftSwap $swap)
    {
        $employee = Employee::where('user_id', auth()->id())->first();
        if (!$employee || $employee->id !== $swap->recipient_id) {
            return back()->with('error', 'Anda tidak memiliki otoritas untuk menyetujui permintaan ini.');
        }

        $swap->update(['status' => 'pending']);
        return back()->with('success', 'Anda telah menyetujui pertukaran. Menunggu persetujuan Manager.');
    }

    public function rejectSwapByRecipient(ShiftSwap $swap)
    {
        $employee = Employee::where('user_id', auth()->id())->first();
        if (!$employee || $employee->id !== $swap->recipient_id) {
            return back()->with('error', 'Anda tidak memiliki otoritas untuk menolak permintaan ini.');
        }

        $swap->update(['status' => 'rejected_by_recipient']);
        return back()->with('success', 'Pertukaran shift telah Anda tolak.');
    }

    public function approveSwap(Request $request, ShiftSwap $swap)
    {
        if (!auth()->user()->hasRole(['owner', 'Admin'])) {
            return back()->with('error', 'Hanya Manager yang dapat mengeksekusi pertukaran.');
        }

        if ($swap->status !== 'pending') {
            return back()->with('error', 'Permohonan ini belum disetujui oleh rekan yang bersangkutan.');
        }

        DB::transaction(function () use ($swap) {
            $reqSched = $swap->requesterSchedule;
            $recSched = $swap->recipientSchedule;

            $empA = $reqSched->employee_id;
            $empB = $recSched->employee_id;

            $reqSched->update(['employee_id' => $empB]);
            $recSched->update(['employee_id' => $empA]);

            $swap->update([
                'status' => 'approved',
                'approved_by' => auth()->id()
            ]);
        });

        return back()->with('success', 'Shift swap approved and executed.');
    }

    public function rejectSwap(ShiftSwap $swap)
    {
        if (!auth()->user()->hasRole(['owner', 'Admin'])) {
            return back()->with('error', 'Hanya Manager yang dapat menolak pertukaran.');
        }

        $swap->update(['status' => 'rejected']);
        return back()->with('success', 'Permohonan tukar shift ditolak oleh Manager.');
    }

    public function destroySchedule(EmployeeSchedule $schedule)
    {
        $schedule->delete();
        return back()->with('success', 'Schedule removed.');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'target_date' => 'required|date',
            'type' => 'required|in:copy_last_week,clear_week,generate_fresh',
        ]);

        $targetDate = Carbon::parse($request->target_date);
        $targetStart = $targetDate->copy()->startOfWeek();
        $targetEnd = $targetDate->copy()->endOfWeek();
        
        $branchId = session('active_branch_id') ?? auth()->user()->branch_id;
        if (!$branchId) {
            $branchId = \App\Models\Branch::first()?->id;
        }

        if ($request->type === 'clear_week') {
            EmployeeSchedule::where('branch_id', $branchId)
                ->whereBetween('date', [$targetStart->format('Y-m-d'), $targetEnd->format('Y-m-d')])
                ->delete();
            return back()->with('success', 'Jadwal pekan ini telah dibersihkan.');
        }

        if ($request->type === 'generate_fresh') {
            EmployeeSchedule::where('branch_id', $branchId)
                ->whereBetween('date', [$targetStart->format('Y-m-d'), $targetEnd->format('Y-m-d')])
                ->delete();

            $employees = Employee::where('branch_id', $branchId)->where('status', '!=', 'inactive')->get();
            $shifts = Shift::where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            })->where('is_active', true)->get();

            if ($employees->isEmpty() || $shifts->isEmpty()) {
                return back()->with('error', 'Tidak dapat generate: Pastikan ada pegawai aktif dan shift yang tersedia.');
            }

            DB::transaction(function() use ($employees, $shifts, $targetStart, $branchId) {
                $shiftCount = $shifts->count();
                $shuffledEmployees = $employees->shuffle();

                foreach ($shuffledEmployees as $index => $employee) {
                    $assignedShift = $shifts[$index % $shiftCount];
                    $dayOffIndex = rand(0, 6);

                    for ($i = 0; $i < 7; $i++) {
                        if ($i === $dayOffIndex) continue;

                        $currentDate = $targetStart->copy()->addDays($i);
                        
                        EmployeeSchedule::create([
                            'employee_id' => $employee->id,
                            'shift_id' => $assignedShift->id,
                            'date' => $currentDate->format('Y-m-d'),
                            'branch_id' => $branchId,
                            'role_note' => 'Auto-Generated (Fixed Shift)'
                        ]);
                    }
                }
            });

            return back()->with('success', 'Jadwal baru berhasil di-generate secara otomatis.');
        }

        if ($request->type === 'copy_last_week') {
            $sourceStart = $targetStart->copy()->subWeek();
            $sourceEnd = $targetEnd->copy()->subWeek();

            $sourceSchedules = EmployeeSchedule::withoutGlobalScopes()
                ->where('branch_id', $branchId)
                ->whereBetween('date', [$sourceStart->format('Y-m-d'), $sourceEnd->format('Y-m-d')])
                ->get();

            if ($sourceSchedules->isEmpty()) {
                return back()->with('error', 'Tidak ada jadwal di pekan sebelumnya untuk disalin.');
            }

            DB::transaction(function() use ($sourceSchedules, $targetStart, $branchId) {
                foreach ($sourceSchedules as $source) {
                    $sourceDate = Carbon::parse($source->date);
                    $dayOffset = $sourceDate->dayOfWeekIso - 1; 
                    $newDate = $targetStart->copy()->addDays($dayOffset);

                    EmployeeSchedule::withoutGlobalScopes()->updateOrCreate(
                        ['employee_id' => $source->employee_id, 'date' => $newDate->format('Y-m-d')],
                        [
                            'shift_id' => $source->shift_id,
                            'branch_id' => $branchId,
                            'role_note' => $source->role_note
                        ]
                    );
                }
            });

            return back()->with('success', 'Jadwal berhasil disalin dari pekan lalu.');
        }
    }
}
