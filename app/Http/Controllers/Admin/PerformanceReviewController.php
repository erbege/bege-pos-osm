<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PerformanceReview;
use App\Services\HR\PerformanceScoreService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerformanceReviewController extends Controller
{
    public function __construct(
        private PerformanceScoreService $performanceService
    ) {
    }

    public function index()
    {
        $branchId = session('active_branch_id') ?? auth()->user()?->branch_id;
        $employees = Employee::where('branch_id', $branchId)->active()->with('position')->get();

        $employeesWithStats = $employees->map(function ($employee) {
            $now = now();
            $currentMonth = $this->performanceService->calculateKPI($employee, $now->month, $now->year);

            $lastMonthDate = $now->copy()->subMonth();
            $lastMonth = $this->performanceService->calculateKPI($employee, $lastMonthDate->month, $lastMonthDate->year);

            // 6-month average
            $trend = $this->performanceService->getTrend($employee, 6);
            $avg6Rating = count($trend) > 0 ? round(collect($trend)->avg('rating'), 1) : 0;
            $avg6OnTime = count($trend) > 0 ? round(collect($trend)->avg('on_time_rate'), 1) : 0;

            // Yearly average
            $yearlyTrend = $this->performanceService->getTrend($employee, $now->month);
            $avgYearRating = count($yearlyTrend) > 0 ? round(collect($yearlyTrend)->avg('rating'), 1) : 0;
            $avgYearOnTime = count($yearlyTrend) > 0 ? round(collect($yearlyTrend)->avg('on_time_rate'), 1) : 0;

            $latestReview = PerformanceReview::where('employee_id', $employee->id)
                ->where('year', $now->year)
                ->where('month', $now->month)
                ->first();

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'position' => $employee->position?->name ?? 'Staff',
                'photo_path' => $employee->photo_path,
                'stats' => [
                    'current_month' => [
                        'rating' => $currentMonth['rating'],
                        'on_time_rate' => $currentMonth['on_time_rate'],
                        'present' => $currentMonth['present_days'],
                        'grade' => $currentMonth['grade'],
                        'recommended_bonus' => $currentMonth['recommended_bonus'],
                    ],
                    'last_month' => [
                        'rating' => $lastMonth['rating'],
                        'on_time_rate' => $lastMonth['on_time_rate'],
                    ],
                    'last_6_months' => [
                        'rating' => $avg6Rating,
                        'on_time_rate' => $avg6OnTime,
                    ],
                    'current_year' => [
                        'rating' => $avgYearRating,
                        'on_time_rate' => $avgYearOnTime,
                    ],
                ],
                'trend' => $trend,
                'latest_review' => $latestReview,
            ];
        });

        return Inertia::render('Admin/PerformanceReviews', [
            'employees' => $employeesWithStats,
            'months' => [
                'Januari',
                'Februari',
                'Maret',
                'April',
                'Mei',
                'Juni',
                'Juli',
                'Agustus',
                'September',
                'Oktober',
                'November',
                'Desember',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
            'speed_score' => 'required|integer|min:0|max:100',
            'quality_score' => 'required|integer|min:0|max:100',
            'bonus_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        PerformanceReview::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            $validated
        );

        return redirect()->back()->with('success', 'Penilaian kinerja berhasil disimpan.');
    }

    public function update(Request $request, PerformanceReview $performanceReview)
    {
        $validated = $request->validate([
            'speed_score' => 'required|integer|min:0|max:100',
            'quality_score' => 'required|integer|min:0|max:100',
            'bonus_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $performanceReview->update($validated);

        return redirect()->back()->with('success', 'Penilaian kinerja berhasil diubah.');
    }

    public function destroy(PerformanceReview $performanceReview)
    {
        $performanceReview->delete();

        return redirect()->back()->with('success', 'Penilaian kinerja berhasil dihapus.');
    }
}
