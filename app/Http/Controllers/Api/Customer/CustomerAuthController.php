<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CustomerAuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'password' => 'required|string|min:8|confirmed',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // 1. Create User
        $branchId = $request->branch_id ?? (\App\Models\Branch::first()->id ?? null);
        
        if (!$branchId) {
            // Create a default branch if none exists to prevent FK violation
            $branch = \App\Models\Branch::create([
                'name' => 'Main Branch',
                'is_active' => true,
            ]);
            $branchId = $branch->id;
        }

        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'branch_id' => $branchId,
        ]);

        // 2. Assign 'customer' role
        // Ensure the role exists before assigning to prevent errors
        try {
            if (!\Spatie\Permission\Models\Role::where('name', 'customer')->exists()) {
                \Spatie\Permission\Models\Role::create(['name' => 'customer']);
            }
            $user->assignRole('customer');
        } catch (\Exception $e) {
            // Log or handle role assignment error
        }

        // 3. Create Customer Profile
        $customer = $user->customer()->create([
            'branch_id' => $user->branch_id,
            'phone' => $request->phone,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'name' => $request->name,

        ]);

        if ($request->filled('address')) {
            $customer->addresses()->create([
                'label' => 'Utama',
                'recipient_name' => $user->name,
                'recipient_phone' => $request->phone,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'is_default' => true,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->role = 'customer';

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load(['customer.addresses', 'roles'])
        ]);
    }

    public function login(Request $request)
    {
        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid login details'
            ], 401);
        }

        // Optionally check if user has 'customer' role to restrict this endpoint
        if (!$user->hasRole('customer')) {
             // If it's a staff member, we can still allow login but maybe they should use staff login
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->role = $user->getRoleNames()->first() ?? 'Customer';

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load(['customer'])
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
}

