<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboard
    ) {}

    public function index(Request $request)
    {
        $isOwner = $request->user()->hasRole('owner') || $request->user()->hasRole('admin');

        return Inertia::render('Admin/Dashboard', [
            'metrics' => $this->dashboard->getKPIMetrics(),
            'charts' => $this->dashboard->getChartData(),
            'topMenus' => $this->dashboard->getTopMenus(),
            'recentOrders' => $this->dashboard->getRecentOrders(),
            'financial' => $this->dashboard->getFinancialSummary(),
            'workforce' => $this->dashboard->getWorkforceSnapshot(),
            'reservations' => $this->dashboard->getReservationAnalytics(),
            'customers' => $this->dashboard->getCustomerInsights(),
            'paymentBreakdown' => $this->dashboard->getPaymentBreakdown(),
            'weeklyComparison' => $this->dashboard->getWeeklyComparison(),
            'branchComparison' => $isOwner ? $this->dashboard->getBranchComparison() : [],
            'isOwner' => $isOwner,
        ]);
    }
}
