<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'is_secret'];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    /**
     * Automatically encrypt/decrypt secret values.
     */
    public function getValueAttribute($value)
    {
        if ($this->is_secret && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value;
            }
        }

        return $value;
    }

    public function setValueAttribute($value)
    {
        $this->attributes['value'] = $this->is_secret
            ? Crypt::encryptString($value ?? '')
            : $value;
    }

    /**
     * Get a setting value by group.key.
     */
    public static function getValue(string $group, string $key, $default = null)
    {
        $setting = static::where('group', $group)->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by group.key.
     */
    public static function setValue(string $group, string $key, $value, bool $isSecret = false)
    {
        return static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value, 'is_secret' => $isSecret]
        );
    }
}
