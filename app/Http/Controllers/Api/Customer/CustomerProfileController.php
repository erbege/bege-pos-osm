<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CustomerProfileController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($request->user()->load(['customer.addresses', 'roles']));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|max:20',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Update User info
        $userUpdateData = $request->only(['name', 'email']);
        if ($request->has('password')) {
            $userUpdateData['password'] = Hash::make($request->password);
        }
        $user->update($userUpdateData);

        // Update Customer profile info
        if ($customer) {
            $customer->update($request->only(['phone', 'latitude', 'longitude']));
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->load('customer')
        ]);
    }

    public function orders(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.menu'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    public function addAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'label' => 'required|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $customer = $request->user()->customer;
        
        if (!$customer) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        if ($request->is_default) {
            $customer->addresses()->update(['is_default' => false]);
        }

        $address = $customer->addresses()->create($request->all());

        return response()->json([
            'message' => 'Address added successfully',
            'address' => $address
        ]);
    }

    public function updateAddress(Request $request, CustomerAddress $address)
    {
        $customer = $request->user()->customer;

        if (!$customer || $address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->is_default) {
            $customer->addresses()->update(['is_default' => false]);
        }

        $address->update($request->all());

        return response()->json([
            'message' => 'Address updated successfully',
            'address' => $address
        ]);
    }

    public function deleteAddress(Request $request, CustomerAddress $address)
    {
        $customer = $request->user()->customer;

        if (!$customer || $address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $address->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }
}
