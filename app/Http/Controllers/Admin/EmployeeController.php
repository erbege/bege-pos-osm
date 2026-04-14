<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Position;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function index()
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;

        return Inertia::render('Admin/Employees', [
            'employees' => Employee::with([
                'user.roles',
                'position',
                'allowances' => fn($q) => $q->active(),
                'performanceReviews' => fn($q) => $q->latest(),
                'schedules' => fn($q) => $q->where('date', '>=', now()->toDateString())->with('shift'),
            ])
                ->where('branch_id', $branchId)
                ->latest()
                ->get(),
            'roles' => Role::all()->pluck('name'),
            'positions' => Position::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nip' => 'nullable|string|max:50|unique:employees,nip',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female',
            'birth_date' => 'nullable|date',
            'position_id' => 'nullable|exists:positions,id',
            'employment_status' => 'required|in:permanent,contract,intern',
            'status' => 'required|in:in_duty,off_duty,on_leave,inactive',
            'pay_type' => 'required|in:salary_and_hourly,salary_only,hourly_only',
            'join_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:join_date',
            'base_salary' => 'required|numeric|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'bpjs_kes' => 'nullable|string|max:50',
            'bpjs_tk' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'email' => 'nullable|email|unique:users,email',
            'role' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $request->file('photo')->store('employees', 'public');
        }

        $employee = Employee::create([
            'nip' => $data['nip'] ?? null,
            'branch_id' => session('active_branch_id') ?? auth()->user()?->branch_id,
            'name' => $data['name'],
            'gender' => $data['gender'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'photo_path' => $data['photo_path'] ?? null,
            'status' => $data['status'] ?? 'off_duty',
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'position_id' => $data['position_id'] ?? null,
            'employment_status' => $data['employment_status'],
            'pay_type' => $data['pay_type'] ?? 'salary_and_hourly',
            'join_date' => $data['join_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'base_salary' => $data['base_salary'],
            'hourly_rate' => $data['hourly_rate'],
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account_name' => $data['bank_account_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'bpjs_kes' => $data['bpjs_kes'] ?? null,
            'bpjs_tk' => $data['bpjs_tk'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        // Optionally create a linked user account
        if (!empty($data['email'])) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt('password'),
                'branch_id' => session('active_branch_id') ?? auth()->user()?->branch_id,
            ]);
            if (!empty($data['role'])) {
                $user->assignRole($data['role']);
            }
            $employee->update(['user_id' => $user->id]);
        }

        return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'nip' => 'nullable|string|max:50|unique:employees,nip,' . $employee->id,
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female',
            'birth_date' => 'nullable|date',
            'position_id' => 'nullable|exists:positions,id',
            'employment_status' => 'required|in:permanent,contract,intern',
            'status' => 'required|in:in_duty,off_duty,on_leave,inactive',
            'pay_type' => 'required|in:salary_and_hourly,salary_only,hourly_only',
            'join_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'base_salary' => 'required|numeric|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'bpjs_kes' => 'nullable|string|max:50',
            'bpjs_tk' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($employee->photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->photo_path);
            }
            $data['photo_path'] = $request->file('photo')->store('employees', 'public');
        }

        unset($data['photo']);

        $employee->update($data);

        return redirect()->back()->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function deletePhoto(Employee $employee)
    {
        if ($employee->photo_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->photo_path);
            $employee->update(['photo_path' => null]);
        }

        return redirect()->back()->with('success', 'Foto karyawan dihapus.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return redirect()->back()->with('success', 'Karyawan dihapus.');
    }
}
