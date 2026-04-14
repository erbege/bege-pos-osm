<?php

namespace App\Traits;

use App\Models\AuditLog;

/**
 * Auditable Trait
 *
 * Auto-logs created/updated/deleted events for any Eloquent model.
 * Apply this trait to critical models like Order, Payment, Material, StockMovement.
 *
 * Usage:
 *   use App\Traits\Auditable;
 *   class Order extends Model { use Auditable; }
 *
 * Optionally define $auditExclude to skip noisy fields:
 *   protected array $auditExclude = ['updated_at', 'remember_token'];
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->logAudit('created', [], $model->getAuditableAttributes());
        });

        static::updated(function ($model) {
            $dirty = $model->getDirty();
            $original = array_intersect_key($model->getOriginal(), $dirty);

            // Filter out excluded fields
            $exclude = $model->auditExclude ?? ['updated_at'];
            $dirty = array_diff_key($dirty, array_flip($exclude));
            $original = array_diff_key($original, array_flip($exclude));

            if (!empty($dirty)) {
                $model->logAudit('updated', $original, $dirty);
            }
        });

        static::deleted(function ($model) {
            $model->logAudit('deleted', $model->getAuditableAttributes(), []);
        });
    }

    /**
     * Write a single audit log entry.
     */
    protected function logAudit(string $action, array $oldValues, array $newValues): void
    {
        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'auditable_type' => get_class($this),
                'auditable_id' => $this->getKey(),
                'old_values' => $oldValues ?: null,
                'new_values' => $newValues ?: null,
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent() ? substr(request()->userAgent(), 0, 255) : null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Never let audit logging break the main flow
            \Illuminate\Support\Facades\Log::warning("Audit log failed: {$e->getMessage()}");
        }
    }

    /**
     * Get model attributes minus excluded fields for logging.
     */
    protected function getAuditableAttributes(): array
    {
        $exclude = $this->auditExclude ?? ['updated_at'];
        return array_diff_key($this->getAttributes(), array_flip($exclude));
    }

    /**
     * Polymorphic relation to audit logs.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
