<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class BranchScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // If we are in the console (e.g. running migrations or seeders), don't apply the scope
        if (app()->runningInConsole()) {
            return;
        }

        // First priority: Session (set by switching or by scanning a QR code)
        $branchId = session('active_branch_id');

        // To prevent recursion when Auth::user() is called (which queries the users table),
        // we skip the Auth check if we are currently querying the users table itself.
        if ($model->getTable() !== 'users' && Auth::check()) {
            $user = Auth::user();

            if ($user->hasRole('owner') || $user->hasRole('admin')) {
                // Admins/Owners use the session-selected branch, falling back to their own branch
                $branchId = $branchId ?: $user->branch_id;
            } else {
                // Staff are strictly locked to their assigned branch
                $branchId = $user->branch_id;
            }
        }

        if ($branchId) {
            $builder->where($model->getTable() . '.branch_id', $branchId);
        }
    }
}
