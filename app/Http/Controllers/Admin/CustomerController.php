<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::withCount('orders')
            ->withSum('orders as total_spent', 'total_amount')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Customers', [
            'customers' => $customers
        ]);
    }

    public function show(Customer $customer)
    {
        return Inertia::render('Admin/CustomerDetail', [
            'customer' => $customer->load(['addresses', 'orders.items.menu', 'reservations'])
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $customer->user_id,
            'phone' => 'required|string|max:20|unique:customers,phone,' . $customer->id,
            'address' => 'nullable|string',
            'birthday' => 'nullable|date',
        ]);

        if ($customer->user) { $customer->user->update(['name' => $validated['name'], 'email' => $validated['email']]); } unset($validated['email']); $customer->update($validated);

        return back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return back()->with('success', 'Customer deleted successfully.');
    }
}
