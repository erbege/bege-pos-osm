<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function summary()
    {
        $today = now()->startOfDay();
        
        $totalSales = Order::where('status', 'completed')
            ->where('created_at', '>=', $today)
            ->sum('total_price');

        $orderCount = Order::where('created_at', '>=', $today)->count();
        
        $activeOrders = Order::whereIn('status', ['pending', 'cooking', 'ready'])->count();

        // Weekly trend (last 7 days)
        $weeklyTrend = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_price) as total')
            )
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json(['data' => [
            'income' => (float)$totalSales,
            'count' => $orderCount,
            'active_orders' => $activeOrders,
            'weekly_trend' => $weeklyTrend
        ]]);
    }

    public function income()
    {
        $monthlyIncome = Order::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(total_price) as total')
            )
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->startOfYear())
            ->groupBy('month')
            ->get();

        return response()->json(['data' => [
            'data' => $monthlyIncome
        ]]);
    }

    public function expense()
    {
        // Assuming there is an Expense model as seen in Models directory
        $expenses = Expense::where('created_at', '>=', now()->startOfMonth())->get();
        
        return response()->json(['data' => [
            'data' => $expenses,
            'total' => $expenses->sum('amount')
        ]]);
    }
}


