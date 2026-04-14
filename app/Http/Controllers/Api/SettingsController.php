<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get basic application settings.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        return response()->json([
            'tax_rate' => config('app.tax_rate', 11), // Default 11%
            'currency' => config('app.currency', 'IDR'),
            'app_name' => config('app.name', 'Garasi 66'),
        ]);
    }
}
