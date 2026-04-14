<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use App\Models\Branch;
use App\Models\Position;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();
        if (!$branch) return;

        // Clean up first to avoid mixed data if needed, or just use updateOrCreate
        // Employee::truncate(); 

        $positions = Position::pluck('id', 'name')->toArray();

        $staffData = [
            ['name' => 'Aditya Pratama', 'pos' => 'Manager', 'role' => 'manager', 'rate' => 35000, 'salary' => 6000000],
            ['name' => 'Hendra Wijaya', 'pos' => 'Supervisor', 'role' => 'manager', 'rate' => 28000, 'salary' => 5000000],
            ['name' => 'Indah Sari', 'pos' => 'Supervisor', 'role' => 'manager', 'rate' => 24000, 'salary' => 4200000],
            ['name' => 'Budi Santoso', 'pos' => 'Barista', 'role' => 'cashier', 'rate' => 20000, 'salary' => 3500000],
            ['name' => 'Citra Lestari', 'pos' => 'Barista', 'role' => 'cashier', 'rate' => 18000, 'salary' => 3000000],
            ['name' => 'Rian Hidayat', 'pos' => 'Barista', 'role' => 'cashier', 'rate' => 18000, 'salary' => 3000000],
            ['name' => 'Dedi Kurniawan', 'pos' => 'Cook', 'role' => 'kitchen', 'rate' => 30000, 'salary' => 5500000],
            ['name' => 'Eka Wahyuni', 'pos' => 'Cook', 'role' => 'kitchen', 'rate' => 25000, 'salary' => 4500000],
            ['name' => 'Fajar Hidayat', 'pos' => 'Cook', 'role' => 'kitchen', 'rate' => 20000, 'salary' => 3500000],
            ['name' => 'Gita Permata', 'pos' => 'Cook', 'role' => 'kitchen', 'rate' => 22000, 'salary' => 4000000],
            ['name' => 'Siti Aminah', 'pos' => 'Cook', 'role' => 'kitchen', 'rate' => 18000, 'salary' => 3200000],
            ['name' => 'Joko Susilo', 'pos' => 'Waiter/Waitress', 'role' => 'cashier', 'rate' => 18000, 'salary' => 3000000],
            ['name' => 'Kiki Amelia', 'pos' => 'Waiter/Waitress', 'role' => 'cashier', 'rate' => 15000, 'salary' => 2500000],
            ['name' => 'Lutfi Hakim', 'pos' => 'Waiter/Waitress', 'role' => 'cashier', 'rate' => 15000, 'salary' => 2500000],
            ['name' => 'Rini Septiani', 'pos' => 'Waiter/Waitress', 'role' => 'cashier', 'rate' => 15000, 'salary' => 2500000],
            ['name' => 'Maya Putri', 'pos' => 'Cashier', 'role' => 'cashier', 'rate' => 18000, 'salary' => 3000000],
            ['name' => 'Andi Wijaya', 'pos' => 'Cashier', 'role' => 'cashier', 'rate' => 18000, 'salary' => 3000000],
            ['name' => 'Nanda Saputra', 'pos' => 'Cleaner', 'role' => null, 'rate' => 12000, 'salary' => 2000000],
            ['name' => 'Oki Ramadhan', 'pos' => 'Cleaner', 'role' => null, 'rate' => 15000, 'salary' => 2500000],
            ['name' => 'Bambang Heru', 'pos' => 'Cleaner', 'role' => null, 'rate' => 12000, 'salary' => 2000000],
        ];

        foreach ($staffData as $index => $data) {
            $email = strtolower(str_replace([' ', '/'], '.', $data['name'])) . '@garasi66.com';
            
            // Create user if role exists
            $userId = null;
            if ($data['role']) {
                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => $data['name'],
                        'password' => bcrypt('password'),
                        'branch_id' => $branch->id,
                    ]
                );
                
                // Attempt role assignment if roles table exists and roles are seeded
                try {
                    $user->syncRoles($data['role']);
                } catch (\Exception $e) {
                    // Silently fail if roles aren't set up yet
                }
                $userId = $user->id;
            }

            Employee::updateOrCreate(
                ['nip' => 'EMP' . str_pad($index + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'user_id' => $userId,
                    'branch_id' => $branch->id,
                    'name' => $data['name'],
                    'status' => $index < 8 ? 'in_duty' : 'off_duty',
                    'phone' => '0812' . rand(10000000, 99999999),
                    'address' => 'Jl. Dummy No. ' . ($index + 1),
                    'position_id' => $positions[$data['pos']] ?? null,
                    'employment_status' => $index < 12 ? 'permanent' : 'contract',
                    'join_date' => Carbon::now()->subMonths(rand(1, 24))->subDays(rand(1, 30)),
                    'base_salary' => $data['salary'],
                    'hourly_rate' => $data['rate'],
                    'bank_name' => 'BCA',
                    'bank_account_name' => strtoupper($data['name']),
                    'bank_account_number' => rand(1000000000, 9999999999),
                ]
            );
        }
    }
}
