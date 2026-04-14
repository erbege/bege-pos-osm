<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use App\Events\ReservationCreated;
use App\Events\ReservationPaymentReceived;
use App\Listeners\CreateReservationPaymentInvoiceListener;
use App\Listeners\SendReservationPaymentLinkListener;
use App\Listeners\ConfirmReservationAfterPaymentListener;

class ReservationServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(
            ReservationCreated::class,
            CreateReservationPaymentInvoiceListener::class,
        );

        Event::listen(
            ReservationCreated::class,
            SendReservationPaymentLinkListener::class,
        );

        Event::listen(
            ReservationPaymentReceived::class,
            ConfirmReservationAfterPaymentListener::class,
        );
    }
}
