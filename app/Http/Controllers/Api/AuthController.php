<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Customer;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            DB::beginTransaction();

            $branchId = \App\Models\Branch::first()->id ?? 1;

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'branch_id' => $branchId,
            ]);

            $user->assignRole('customer');

            $customer = Customer::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->phone,
                'branch_id' => $branchId,
            ]);

            $token = $user->createToken('mobile-customer-token')->plainTextToken;

            DB::commit();

            return response()->json([
                'message' => 'Registration successful',
                'user' => $user,
                'profile' => $customer,
                'token' => $token
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Authenticate against Users table
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // 2. Determine Role and Fetch Profile
        $role = strtolower($user->getRoleNames()->first() ?? 'customer');
        $profile = null;

        if ($role === 'customer') {
            $profile = Customer::where('user_id', $user->id)->first();
        } else {
            // Staff/Employee/Admin/Owner roles
            $profile = Employee::where('user_id', $user->id)->with(['position', 'branch'])->first();
        }

        $token = $user->createToken('mobile-auth-token')->plainTextToken;
        $user->role = $role;

        return response()->json([
            'user' => $user,
            'profile' => $profile,
            'token' => $token,
            'role' => $role
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $role = strtolower($user->getRoleNames()->first() ?? 'customer');
        
        $profile = null;
        if ($role === 'customer') {
            $profile = Customer::where('user_id', $user->id)->first();
        } else {
            $profile = Employee::where('user_id', $user->id)->with(['position', 'branch'])->first();
        }

        return response()->json([
            'user' => $user,
            'profile' => $profile,
            'role' => $role
        ]);
    }
}