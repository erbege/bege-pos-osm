<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;
use App\Models\Branch;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ──────────────────────────────────────
        // 1. Define & Create Permissions
        // ──────────────────────────────────────
        $permissions = [
            'manage orders',
            'view orders',
            'create orders',
            'cancel orders',
            'update order status',
            'manage menus',
            'view menus',
            'manage inventory',
            'view inventory',
            'manage transfers',
            'approve transfers',
            'manage branches',
            'switch branches',
            'manage employees',
            'view employees',
            'manage payroll',
            'view reports',
            'manage finance',
            'manage tables',
            'manage purchases',
            'create reservations',
            'view reservations',
            'cancel reservations',
            'manage profile',
            'full access',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Reset cache again after creation
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ──────────────────────────────────────
        // 2. Define Roles & Their Permissions
        // ──────────────────────────────────────
        $roles = [
            'owner' => ['full access'],
            'manager' => [
                'view reports',
                'manage inventory',
                'view inventory',
                'manage menus',
                'view menus',
                'manage orders',
                'view orders',
                'manage transfers',
                'approve transfers',
                'manage employees',
                'view employees',
                'manage tables',
                'manage purchases',
                'switch branches',
                'manage finance',
                'view reservations',
                'create reservations',
                'cancel reservations',
            ],
            'supervisor' => [
                'view reports',
                'manage orders',
                'view orders',
                'cancel orders',
                'update order status',
                'view menus',
                'view inventory',
                'manage tables',
                'view employees',
                'view reservations',
            ],
            'cashier' => [
                'manage orders',
                'view orders',
                'create orders',
                'view menus',
                'view inventory',
                'view reservations',
            ],
            'chef' => [
                'manage menus',
                'view menus',
                'update order status',
                'view orders',
                'manage inventory',
                'view inventory',
            ],
            'cook' => [
                'view orders',
                'update order status',
                'view menus',
                'view inventory',
            ],
            'barista' => [
                'view orders',
                'update order status',
                'view menus',
                'view inventory',
            ],
            'kitchen' => [
                'update order status',
                'view orders',
                'view menus',
            ],
            'helper' => [
                'view orders',
                'view menus',
            ],
            'steward' => [
                'view orders',
            ],
            'hr' => [
                'manage payroll',
                'manage employees',
                'view employees',
                'view reports',
            ],
            'finance' => [
                'manage finance',
                'manage purchases',
                'manage payroll',
                'view reports',
                'view orders',
                'view inventory',
            ],
            'customer' => [
                'view menus',
                'create orders',
                'view orders',
                'create reservations',
                'view reservations',
                'cancel reservations',
                'manage profile',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::findOrCreate($roleName);
            $role->syncPermissions($rolePermissions);
        }

        // ──────────────────────────────────────
        // 3. Create One User Per Role
        // ──────────────────────────────────────
        $branch = Branch::first();

        $users = [
            [
                'name' => 'Super Owner',
                'email' => 'owner@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'owner',
            ],
            [
                'name' => 'Branch Manager',
                'email' => 'manager@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'manager',
            ],
            [
                'name' => 'Shift Supervisor',
                'email' => 'supervisor@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'supervisor',
            ],
            [
                'name' => 'Head Chef',
                'email' => 'chef@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'chef',
            ],
            [
                'name' => 'Line Cook',
                'email' => 'cook@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'cook',
            ],
            [
                'name' => 'Lead Barista',
                'email' => 'barista@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'barista',
            ],
            [
                'name' => 'Kitchen Helper',
                'email' => 'helper@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'helper',
            ],
            [
                'name' => 'Steward Staff',
                'email' => 'steward@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'steward',
            ],
            [
                'name' => 'Cashier Staff',
                'email' => 'cashier@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'cashier',
            ],
            [
                'name' => 'Kitchen Staff',
                'email' => 'kitchen@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'kitchen',
            ],
            [
                'name' => 'HR Admin',
                'email' => 'hr@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'hr',
            ],
            [
                'name' => 'Finance Staff',
                'email' => 'finance@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'finance',
            ],
            [
                'name' => 'Regular Customer',
                'email' => 'customer@garasi66.com',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);

            $userData['branch_id'] = $branch->id;

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $user->syncRoles($roleName);

            // Create customer record for customer role
            if ($roleName === 'customer') {
                \App\Models\Customer::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'name' => $user->name,
                        'branch_id' => $branch->id,
                    ]
                );
            }
        }
    }
}
