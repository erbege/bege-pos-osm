<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Admin/Discounts', [
            'discounts' => Discount::orderBy('created_at', 'desc')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $mode = $request->input('creation_mode', 'manual');

        if ($mode === 'manual') {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:discounts,code',
                'type' => 'required|in:fixed,percentage',
                'value' => 'required|numeric|min:0',
                'min_purchase_amount' => 'required|numeric|min:0',
                'payment_method' => 'nullable|string',
                'bank_name' => 'nullable|string',
                'usage_limit' => 'required|integer|min:0',
                'valid_from' => 'nullable|date',
                'valid_until' => 'nullable|date|after_or_equal:valid_from',
                'is_active' => 'boolean',
                'is_automatic' => 'boolean',
            ]);

            Discount::create($validated);
            return back()->with('success', 'Voucher created successfully.');
        } else {
            // Bulk Generation Mode
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'count' => 'required|integer|min:1|max:100',
                'type' => 'required|in:fixed,percentage',
                'value' => 'required|numeric|min:0',
                'min_purchase_amount' => 'required|numeric|min:0',
                'payment_method' => 'nullable|string',
                'bank_name' => 'nullable|string',
                'valid_from' => 'nullable|date',
                'valid_until' => 'nullable|date|after_or_equal:valid_from',
                'is_active' => 'boolean',
                'is_automatic' => 'boolean',
            ]);

            for ($i = 0; $i < $validated['count']; $i++) {
                $code = $this->generateUniqueCode();
                Discount::create([
                    'name' => $validated['name'],
                    'code' => $code,
                    'type' => $validated['type'],
                    'value' => $validated['value'],
                    'min_purchase_amount' => $validated['min_purchase_amount'],
                    'payment_method' => $validated['payment_method'],
                    'bank_name' => $validated['bank_name'],
                    'usage_limit' => 1, // Single use per unique code
                    'valid_from' => $validated['valid_from'],
                    'valid_until' => $validated['valid_until'],
                    'is_active' => $validated['is_active'] ?? true,
                    'is_automatic' => $validated['is_automatic'] ?? false,
                ]);
            }

            return back()->with('success', $validated['count'] . ' unique vouchers generated.');
        }
    }

    /**
     * Generate a unique random voucher code
     */
    private function generateUniqueCode()
    {
        do {
            $code = strtoupper(\Illuminate\Support\Str::random(8));
        } while (Discount::where('code', $code)->exists());

        return $code;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discounts,code,' . $discount->id,
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_purchase_amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'usage_limit' => 'required|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
            'is_automatic' => 'boolean',
        ]);

        $discount->update($validated);

        return back()->with('success', 'Voucher updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Discount $discount)
    {
        $discount->delete();

        return back()->with('success', 'Voucher deleted successfully.');
    }

    /**
     * Toggle the active status of a voucher.
     */
    public function toggleStatus(Discount $discount)
    {
        $discount->update([
            'is_active' => !$discount->is_active
        ]);

        return back()->with('success', 'Voucher status updated.');
    }
}
