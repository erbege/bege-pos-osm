<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\Material;
use App\Models\PurchaseOrder;
use App\Models\Payment;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Reservation;
use App\Models\Customer;
use App\Models\Ledger;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get enhanced KPI metrics for the dashboard.
     */
    public function getKPIMetrics(): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // Today's orders
        $todaysOrders = Order::whereDate('created_at', $today)->get();
        $todaysSales = (float) $todaysOrders->whereIn('status', ['Completed', 'Served', 'Pending'])->sum('total_amount');
        $totalOrdersToday = $todaysOrders->count();
        $completedOrdersToday = $todaysOrders->whereIn('status', ['Completed', 'Served', 'Pending'])->count();

        // Yesterday's orders
        $yesterdaysOrders = Order::whereDate('created_at', $yesterday)->get();
        $yesterdaysSales = (float) $yesterdaysOrders->whereIn('status', ['Completed', 'Served', 'Pending'])->sum('total_amount');
        $totalOrdersYesterday = $yesterdaysOrders->count();

        // Growth percentages
        $salesGrowth = $yesterdaysSales > 0
            ? round((($todaysSales - $yesterdaysSales) / $yesterdaysSales) * 100, 1)
            : 0;
        $orderGrowth = $totalOrdersYesterday > 0
            ? round((($totalOrdersToday - $totalOrdersYesterday) / $totalOrdersYesterday) * 100, 1)
            : 0;

        // Average Order Value
        $avgOrderValue = $completedOrdersToday > 0
            ? round($todaysSales / $completedOrdersToday)
            : 0;

        $yesterdayCompleted = $yesterdaysOrders->where('status', 'Completed')->count();
        $yesterdayAOV = ($yesterdayCompleted > 0 && $yesterdaysSales > 0)
            ? round($yesterdaysSales / $yesterdayCompleted)
            : 0;
        $aovGrowth = $yesterdayAOV > 0
            ? round((($avgOrderValue - $yesterdayAOV) / $yesterdayAOV) * 100, 1)
            : 0;

        // Operational
        $activeTables = Table::where('status', 'occupied')->count();
        $totalTables = Table::count();
        $lowStockCount = Material::where('track_inventory', true)
            ->whereRaw('stock <= min_stock')
            ->count();
        $pendingPOCount = PurchaseOrder::whereNotIn('status', ['received', 'cancelled'])->count();

        return [
            'todaysSales' => $todaysSales,
            'salesGrowth' => $salesGrowth,
            'totalOrdersToday' => $totalOrdersToday,
            'orderGrowth' => $orderGrowth,
            'avgOrderValue' => $avgOrderValue,
            'aovGrowth' => $aovGrowth,
            'activeTables' => $activeTables,
            'totalTables' => $totalTables,
            'lowStockCount' => $lowStockCount,
            'pendingPOCount' => $pendingPOCount,
        ];
    }

    /**
     * Get chart data for revenue trends and distributions.
     */
    public function getChartData(): array
    {
        $today = Carbon::today();

        // Sales Trends (Last 30 Days)
        $salesTrend = Order::whereIn('status', ['Completed', 'Served', 'Pending'])
            ->where('created_at', '>=', $today->copy()->subDays(30))
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => Carbon::parse($item->date)->format('d M'),
                'revenue' => (float) $item->revenue,
                'orders' => (int) $item->orders,
            ]);

        // Hourly Sales Distribution (Today)
        $hourlySales = Order::whereDate('created_at', $today)
            ->whereIn('status', ['Completed', 'Served', 'Pending'])
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        $hourlyDistribution = collect(range(0, 23))->map(fn($hour) => [
            'hour' => sprintf('%02d:00', $hour),
            'revenue' => (float) ($hourlySales[$hour]->revenue ?? 0),
            'orders' => (int) ($hourlySales[$hour]->orders ?? 0),
        ]);

        // Category Performance (Last 7 days)
        $categoryStats = OrderItem::whereHas('order', fn($q) => $q->whereIn('status', ['Completed', 'Served', 'Pending'])->whereDate('created_at', '>=', $today->copy()->subDays(7)))
            ->join('menus', 'order_items.menu_id', '=', 'menus.id')
            ->join('categories', 'menus.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('SUM(order_items.subtotal) as revenue'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        return [
            'salesTrend' => $salesTrend,
            'hourlyDistribution' => $hourlyDistribution,
            'categoryStats' => $categoryStats,
        ];
    }

    /**
     * Get top selling menus (last 7 days).
     */
    public function getTopMenus(): \Illuminate\Support\Collection
    {
        $today = Carbon::today();
        return OrderItem::whereHas('order', fn($q) => $q->where('status', 'Completed')->whereDate('created_at', '>=', $today->copy()->subDays(7)))
            ->join('menus', 'order_items.menu_id', '=', 'menus.id')
            ->select('menus.name', DB::raw('SUM(order_items.qty) as total_qty'), DB::raw('SUM(order_items.subtotal) as total_revenue'))
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();
    }

    /**
     * Get recent orders.
     */
    public function getRecentOrders(): \Illuminate\Support\Collection
    {
        return Order::with(['table', 'user'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number ?? 'ORD-' . $order->id,
                'table' => $order->table->name ?? 'Takeaway',
                'customer' => $order->customer_name ?? 'Guest',
                'total' => $order->total_amount,
                'status' => $order->status,
                'time' => $order->created_at->diffForHumans(),
            ]);
    }

    /**
     * Get financial summary (P&L) for the current month.
     */
    public function getFinancialSummary(): array
    {
        $branchId = auth()->user()->branch_id;
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $totalIncome = (float) Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('type', 'revenue'))
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('credit');

        $totalExpense = (float) Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('type', 'expense'))
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->sum('debit');

        $netProfit = $totalIncome - $totalExpense;
        $profitMargin = $totalIncome > 0 ? round(($netProfit / $totalIncome) * 100, 1) : 0;

        // Last month comparison
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        $lastMonthIncome = (float) Ledger::where('branch_id', $branchId)
            ->whereHas('account', fn($q) => $q->where('type', 'revenue'))
            ->whereBetween('date', [$lastMonthStart, $lastMonthEnd])
            ->sum('credit');

        $incomeGrowth = $lastMonthIncome > 0
            ? round((($totalIncome - $lastMonthIncome) / $lastMonthIncome) * 100, 1)
            : 0;

        return [
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'netProfit' => $netProfit,
            'profitMargin' => $profitMargin,
            'incomeGrowth' => $incomeGrowth,
        ];
    }

    /**
     * Get workforce / HR snapshot.
     */
    public function getWorkforceSnapshot(): array
    {
        $today = Carbon::today();

        $totalActiveEmployees = Employee::active()->count();

        $todayAttendance = Attendance::whereDate('date', $today)->get();
        $presentCount = $todayAttendance->where('is_absent', false)->count();
        $lateCount = $todayAttendance->where('status', 'late')->where('is_absent', false)->count();
        $absentCount = $todayAttendance->where('is_absent', true)->count();

        $attendanceRate = $totalActiveEmployees > 0
            ? round(($presentCount / $totalActiveEmployees) * 100, 1)
            : 0;

        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        return [
            'totalEmployees' => $totalActiveEmployees,
            'present' => $presentCount,
            'late' => $lateCount,
            'absent' => $absentCount,
            'attendanceRate' => $attendanceRate,
            'pendingLeaves' => $pendingLeaves,
        ];
    }

    /**
     * Get reservation analytics.
     */
    public function getReservationAnalytics(): array
    {
        $today = Carbon::today();

        $todayReservations = Reservation::whereDate('reservation_date', $today)->get();
        $confirmed = $todayReservations->filter(fn($r) => $r->getRawOriginal('status') === 'confirmed')->count();
        $checkedIn = $todayReservations->filter(fn($r) => $r->getRawOriginal('status') === 'checked_in')->count();
        $completed = $todayReservations->filter(fn($r) => $r->getRawOriginal('status') === 'completed')->count();
        $noShow = $todayReservations->filter(fn($r) => $r->getRawOriginal('status') === 'no_show')->count();
        $totalToday = $todayReservations->count();

        $upcomingCount = Reservation::where('reservation_date', '>', $today)
            ->where('reservation_date', '<=', $today->copy()->addDays(7))
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        $avgGuests = $todayReservations->count() > 0
            ? round($todayReservations->avg('guest_count'), 1)
            : 0;

        $todayRevenue = (float) $todayReservations->sum('total_estimated_amount');

        return [
            'totalToday' => $totalToday,
            'confirmed' => $confirmed,
            'checkedIn' => $checkedIn,
            'completed' => $completed,
            'noShow' => $noShow,
            'upcomingCount' => $upcomingCount,
            'avgGuests' => $avgGuests,
            'todayRevenue' => $todayRevenue,
        ];
    }

    /**
     * Get customer insights.
     */
    public function getCustomerInsights(): array
    {
        $startOfMonth = Carbon::now()->startOfMonth();

        $totalCustomers = Customer::count();
        $newThisMonth = Customer::where('created_at', '>=', $startOfMonth)->count();

        // Use reservations for top customers (orders table has no customer_id FK)
        $topCustomers = Customer::withCount(['reservations as total_reservations' => function ($q) {
                $q->whereIn('status', ['completed', 'checked_in', 'confirmed']);
            }])
            ->withSum(['reservations as total_spending' => function ($q) {
                $q->whereIn('status', ['completed', 'checked_in', 'confirmed']);
            }], 'total_estimated_amount')
            ->orderByDesc('total_spending')
            ->limit(5)
            ->get()
            ->filter(fn($c) => $c->total_spending > 0)
            ->values()
            ->map(fn($c) => [
                'name' => $c->name,
                'orders' => (int) $c->total_reservations,
                'spending' => (float) ($c->total_spending ?? 0),
            ]);

        return [
            'totalCustomers' => $totalCustomers,
            'newThisMonth' => $newThisMonth,
            'topCustomers' => $topCustomers,
        ];
    }

    /**
     * Get payment method breakdown for today.
     */
    public function getPaymentBreakdown(): array
    {
        $today = Carbon::today();

        $breakdown = Order::whereDate('created_at', $today)
            ->whereIn('status', ['Completed', 'Served', 'Pending'])
            ->selectRaw('payment_method, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get()
            ->map(fn($p) => [
                'method' => $p->payment_method ?? 'Unknown',
                'total' => (float) $p->total,
                'count' => (int) $p->count,
            ]);

        return $breakdown->toArray();
    }

    /**
     * Get weekly comparison (this week vs last week daily revenue).
     */
    public function getWeeklyComparison(): array
    {
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfLastWeek = Carbon::now()->subWeek()->startOfWeek();
        $endOfLastWeek = Carbon::now()->subWeek()->endOfWeek();

        $thisWeekData = Order::whereIn('status', ['Completed', 'Served', 'Pending'])
            ->where('created_at', '>=', $startOfWeek)
            ->selectRaw('DAYOFWEEK(created_at) as dow, SUM(total_amount) as revenue')
            ->groupBy('dow')
            ->pluck('revenue', 'dow');

        $lastWeekData = Order::whereIn('status', ['Completed', 'Served', 'Pending'])
            ->whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])
            ->selectRaw('DAYOFWEEK(created_at) as dow, SUM(total_amount) as revenue')
            ->groupBy('dow')
            ->pluck('revenue', 'dow');

        $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        // MySQL DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday
        $dowMap = [2, 3, 4, 5, 6, 7, 1]; // Mon=2, Tue=3, ... Sun=1

        return collect($days)->map(function ($day, $i) use ($thisWeekData, $lastWeekData, $dowMap) {
            $dow = $dowMap[$i];
            return [
                'day' => $day,
                'thisWeek' => (float) ($thisWeekData[$dow] ?? 0),
                'lastWeek' => (float) ($lastWeekData[$dow] ?? 0),
            ];
        })->toArray();
    }

    /**
     * Get branch comparison (owner only).
     */
    public function getBranchComparison(): array
    {
        $today = Carbon::today();
        $branches = Branch::all();

        $branchStats = Order::withoutGlobalScopes()
            ->whereDate('created_at', $today)
            ->selectRaw('branch_id, SUM(CASE WHEN status IN ("Completed", "Served", "Pending") THEN total_amount ELSE 0 END) as total_sales, COUNT(*) as total_orders, AVG(CASE WHEN status IN ("Completed", "Served", "Pending") THEN total_amount END) as avg_order')
            ->groupBy('branch_id')
            ->get()
            ->keyBy('branch_id');

        return $branches->map(function ($branch) use ($branchStats) {
            $stats = $branchStats->get($branch->id);
            return [
                'name' => $branch->name,
                'sales' => (float) ($stats->total_sales ?? 0),
                'orders' => (int) ($stats->total_orders ?? 0),
                'avgOrder' => round((float) ($stats->avg_order ?? 0)),
            ];
        })->toArray();
    }
}
