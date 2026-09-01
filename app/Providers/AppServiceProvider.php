<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
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
        if (str_starts_with(config('app.url'), 'https')) {
            \Illuminate\Support\Facades\URL::forceRootUrl(config('app.url'));
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        $this->configureRateLimiting();

        // Register Accounting Subscriber
        \Illuminate\Support\Facades\Event::subscribe(\App\Listeners\AccountingSubscriber::class);
    }

    /**
     * Configure rate limiters for security-critical endpoints.
     */
    protected function configureRateLimiting(): void
    {
        // Login: 5 attempts per minute per IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Payment webhook: 30 per minute per IP (gateways may batch)
        RateLimiter::for('payment', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Offline sync: 10 per minute per user
        RateLimiter::for('sync', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // General API: 60 per minute per user
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
