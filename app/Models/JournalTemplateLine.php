<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalTemplateLine extends Model
{
    protected $guarded = [];

    public function template()
    {
        return $this->belongsTo(JournalTemplate::class, 'template_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_code', 'code');
    }
}
