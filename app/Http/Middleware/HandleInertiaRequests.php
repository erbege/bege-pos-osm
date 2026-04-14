<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->getRoleNames(),
                ]) : null,
            ],
            'branches' => $user && ($user->hasRole('owner') || $user->hasRole('Admin'))
                ? \App\Models\Branch::where('is_active', true)->get()
                : [],
            'currentBranchId' => $user ? (session('active_branch_id') ?: $user->branch_id) : null,
            'activeTableId' => session('active_table_id'),
            'activeTableName' => session('active_table_id') ? \App\Models\Table::withoutGlobalScopes()->find(session('active_table_id'))?->name : null,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
