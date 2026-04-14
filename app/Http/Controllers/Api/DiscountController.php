<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DiscountController extends Controller
{
    /**
     * Validate a discount code against a subtotal
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0'
        ]);

        $discount = \App\Models\Discount::where('code', $request->code)->first();

        if (!$discount) {
            return response()->json(['message' => 'Discount code not found.'], 404);
        }

        if (!$discount->is_active) {
            return response()->json(['message' => 'This discount code is inactive.'], 400);
        }

        if (!$discount->isValidForAmount($request->subtotal)) {
            return response()->json([
                'message' => 'This discount is invalid for the current order amount or has expired. Minimum purchase is Rp ' . number_format($discount->min_purchase_amount, 0, ',', '.')
            ], 400);
        }

        $discountAmount = $discount->calculateDiscount($request->subtotal);

        return response()->json([
            'code' => $discount->code,
            'name' => $discount->name,
            'discount_amount' => $discountAmount,
            'type' => $discount->type
        ]);
    }
}
