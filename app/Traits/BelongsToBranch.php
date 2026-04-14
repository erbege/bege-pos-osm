<?php

namespace App\Traits;

use App\Scopes\BranchScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToBranch
{
    /**
     * Boot the trait and apply the global scope.
     */
    protected static function bootBelongsToBranch()
    {
        static::addGlobalScope(new BranchScope);

        static::creating(function ($model) {
            if (!$model->branch_id) {
                $sessionBranchId = session('active_branch_id');

                if (Auth::check()) {
                    $user = Auth::user();
                    if ($user->hasRole('owner') || $user->hasRole('admin')) {
                        $model->branch_id = $sessionBranchId ?: $user->branch_id;
                    } else {
                        $model->branch_id = $user->branch_id;
                    }
                } else {
                    // Guest user - use session
                    $model->branch_id = $sessionBranchId;
                }
            }
        });
    }

    /**
     * Define the relationship to the Branch model.
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }
}
