<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckAvailabilityRequest;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Services\ReservationService;
use App\Services\TableAvailabilityEngine;
use App\DTO\ReservationData;

class ReservationController extends Controller
{
    public function __construct(
        private ReservationService $reservationService,
        private TableAvailabilityEngine $tableEngine
    ) {
    }

    public function store(StoreReservationRequest $request)
    {
        $dto = ReservationData::fromRequest($request);

        try {
            $reservation = $this->reservationService->createReservation($dto);
            return new ReservationResource($reservation);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process reservation', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkAvailability(CheckAvailabilityRequest $request)
    {
        $options = $this->tableEngine->getSuggestedOptions(
            $request->guest_count,
            $request->reservation_date,
            $request->start_time,
            $request->end_time,
            $request->room_id
        );

        return response()->json([
            'available_options' => $options
        ]);
    }
}
