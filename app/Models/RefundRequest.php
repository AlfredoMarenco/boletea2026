<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundRequest extends Model
{
    protected $fillable = [
        'refund_event_id',
        'refund_purchase_id',
        'order_number',
        'tracking_id',
        'email',
        'buyer_name',
        'clabe',
        'bank_name',
        'card_last_four',
        'ine_path',
        'proof_of_payment_path',
        'tickets_path',
        'validated_tickets',
        'validated_documents',
        'include_charges',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'validated_tickets' => 'array',
        'validated_documents' => 'array',
        'include_charges' => 'boolean',
    ];

    public function refundEvent(): BelongsTo
    {
        return $this->belongsTo(RefundEvent::class);
    }

    public function refundPurchase(): BelongsTo
    {
        return $this->belongsTo(RefundPurchase::class);
    }

    /**
     * Check if a rejected request has unvalidated documents/data requiring correction.
     */
    public function hasPendingCorrections(): bool
    {
        if ($this->status !== 'rejected') {
            return false;
        }

        $validated = $this->validated_documents ?? [];

        if (! empty($this->clabe) && empty($validated['clabe'])) {
            return true;
        }

        if (! empty($this->ine_path) && empty($validated['ine'])) {
            return true;
        }

        if (! empty($this->proof_of_payment_path) && empty($validated['proof'])) {
            return true;
        }

        if (! empty($this->tickets_path)) {
            $parsed = null;
            try {
                $parsed = is_string($this->tickets_path) ? json_decode($this->tickets_path, true) : $this->tickets_path;
            } catch (\Throwable $e) {
            }

            if (is_array($parsed)) {
                foreach ($parsed as $subId => $path) {
                    if (empty($validated['ticket_'.$subId])) {
                        return true;
                    }
                }
            } else {
                if (empty($validated['tickets'])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a refund request is active or pending correction.
     */
    public function isActiveOrPendingCorrection(): bool
    {
        if (in_array($this->status, ['pending', 'processing', 'approved'], true)) {
            return true;
        }

        return $this->status === 'rejected' && $this->hasPendingCorrections();
    }

    /**
     * Check if request is completely/totally rejected (no pending document corrections allowed).
     */
    public function isTotallyRejected(): bool
    {
        return $this->status === 'rejected' && ! $this->hasPendingCorrections();
    }
}
