<?php

namespace App\Actions\Reservation;

use Illuminate\Support\Str;

class GenerateReservationCodeAction
{
    /**
     * Generate a unique reservation string like RSV-231015-B1-XXXX
     */
    public function execute(int $branchId, string $date): string
    {
        $dateStr = \Carbon\Carbon::parse($date)->format('ymd');
        $random = Str::upper(Str::random(4));

        return "RSV-{$dateStr}-B{$branchId}-{$random}";
    }
}
