<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Reservation;
use App\Models\Table;
use Illuminate\Support\Facades\Auth;

use App\Services\TableAvailabilityEngine;
use Carbon\Carbon;
use App\Domain\Reservation\Enums\ReservationStatus;
use App\Domain\Payment\Enums\PaymentStatus;

class ReservationController extends Controller
{
    protected $tableEngine;

    public function __construct(TableAvailabilityEngine $tableEngine)
    {
        $this->tableEngine = $tableEngine;
    }
    public function index()
    {
        $reservations = Reservation::with(['tables', 'menus.menu', 'room'])
            ->orderBy('reservation_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        $rooms = \App\Models\Room::with('tables')->get();
        $menus = \App\Models\Menu::with('category')->get()->map(function ($m) {
            if ($m->image) {
                $m->image_url = asset('storage/' . $m->image);
            }
            return $m;
        });

        return Inertia::render('Admin/Reservations', [
            'reservations' => $reservations,
            'rooms' => $rooms,
            'menus' => $menus,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'pax' => 'required|integer|min:1',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_dp_required' => 'boolean',
            'dp_percentage' => 'nullable|numeric|min:0|max:100',
            'payment_mode' => 'required|in:none,dp,full',
            'menus' => 'nullable|array',
            'menus.*.id' => 'exists:menus,id',
            'menus.*.qty' => 'integer|min:1',
            'estimated_amount' => 'nullable|numeric',
        ]);

        $duration = $this->tableEngine->getDurationByGuestCount($validated['pax']);
        $endTime = Carbon::parse($validated['reservation_time'])->addMinutes($duration)->format('H:i:s');

        $data = [
            'branch_id' => Auth::user()->branch_id,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'guest_count' => $validated['pax'],
            'reservation_date' => $validated['reservation_date'],
            'start_time' => $validated['reservation_time'],
            'end_time' => $endTime,
            'status' => $validated['status'] ?? ReservationStatus::Confirmed->value,
            'payment_status' => PaymentStatus::Unpaid->value,
            'payment_mode' => $validated['payment_mode'],
            'is_dp_required' => $validated['is_dp_required'] ?? false,
            'dp_percentage' => $validated['dp_percentage'] ?? 0,
            'dp_amount' => ($validated['dp_percentage'] ?? 0) > 0 ? ($validated['dp_percentage'] / 100) * ($request->estimated_amount ?? 0) : 0,
            'total_estimated_amount' => $request->estimated_amount ?? 0,
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ];

        $reservation = Reservation::create($data);

        // Sync table association
        $tableIds = $request->table_ids ?? ($request->table_id ? [$request->table_id] : []);
        $reservation->tables()->sync($tableIds);

        // Pre-order menus
        if (!empty($validated['menus'])) {
            $menuIds = collect($validated['menus'])->pluck('id');
            $menus = \App\Models\Menu::whereIn('id', $menuIds)->get()->keyBy('id');

            foreach ($validated['menus'] as $menu) {
                $m = $menus->get($menu['id']);
                if ($m) {
                    $reservation->menus()->create([
                        'menu_id' => $menu['id'],
                        'quantity' => $menu['qty'],
                        'price_snapshot' => $m->price,
                    ]);
                }
            }
        }

        return back()->with('success', 'Reservasi berhasil dibuat.');
    }

    public function update(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'pax' => 'required|integer|min:1',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required',
            'status' => 'required|string',
            'notes' => 'nullable|string',
            'is_dp_required' => 'boolean',
            'dp_percentage' => 'nullable|numeric|min:0|max:100',
            'payment_mode' => 'required|in:none,dp,full',
            'menus' => 'nullable|array',
            'menus.*.id' => 'exists:menus,id',
            'menus.*.qty' => 'integer|min:1',
        ]);

        $duration = $this->tableEngine->getDurationByGuestCount($validated['pax']);
        $endTime = Carbon::parse($validated['reservation_time'])->addMinutes($duration)->format('H:i:s');

        $reservation->update([
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'guest_count' => $validated['pax'],
            'reservation_date' => $validated['reservation_date'],
            'start_time' => $validated['reservation_time'],
            'end_time' => $endTime,
            'status' => $validated['status'],
            'payment_mode' => $validated['payment_mode'],
            'is_dp_required' => $validated['is_dp_required'] ?? false,
            'dp_percentage' => $validated['dp_percentage'] ?? 0,
            'notes' => $validated['notes'],
        ]);

        $tableIds = $request->table_ids ?? ($request->table_id ? [$request->table_id] : []);
        $reservation->tables()->sync($tableIds);

        // Pre-order menus
        if (isset($validated['menus'])) {
            $reservation->menus()->delete();
            $menuIds = collect($validated['menus'])->pluck('id');
            $menus = \App\Models\Menu::whereIn('id', $menuIds)->get()->keyBy('id');

            foreach ($validated['menus'] as $menu) {
                $m = $menus->get($menu['id']);
                if ($m) {
                    $reservation->menus()->create([
                        'menu_id' => $menu['id'],
                        'quantity' => $menu['qty'],
                        'price_snapshot' => $m->price,
                    ]);
                }
            }
        }

        return back()->with('success', 'Reservasi berhasil diperbarui.');
    }

    public function destroy(Reservation $reservation)
    {
        $reservation->delete();
        return back()->with('success', 'Reservasi berhasil dihapus.');
    }
}
