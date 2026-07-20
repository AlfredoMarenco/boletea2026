<?php

namespace App\Http\Controllers;

use App\Mail\RefundStatusMail;
use App\Models\Bank;
use App\Models\RefundEvent;
use App\Models\RefundPurchase;
use App\Models\RefundRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RefundController extends Controller
{
    /**
     * Show the public refund form.
     */
    public function showForm(): InertiaResponse
    {
        $events = RefundEvent::with('externalEvent')
            ->where('status', 'active')
            ->get()
            ->map(function (RefundEvent $refundEvent) {
                return [
                    'id' => $refundEvent->id,
                    'title' => $refundEvent->externalEvent->title ?? 'Evento Desconocido',
                    'start_date' => $refundEvent->externalEvent->start_date ? $refundEvent->externalEvent->start_date->format('Y-m-d') : null,
                ];
            });

        $ticketSampleImage = \App\Models\SiteSetting::where('key', 'refund_ticket_sample_image')->first()?->value;
        $banks = Bank::orderBy('name')->get();

        return Inertia::render('Public/Refund/RefundForm', [
            'events' => $events,
            'ticketSampleImage' => $ticketSampleImage,
            'banks' => $banks,
        ]);
    }

    /**
     * Step 1: Validate if order exists.
     */
    public function validateOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refund_event_id' => 'required|exists:refund_events,id',
            'order_number' => 'required|string',
        ]);

        $existingRequests = RefundRequest::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number'])
            ->whereIn('status', ['pending', 'processing', 'approved'])
            ->get();

        $purchase = RefundPurchase::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number'])
            ->first();

        if (! $purchase) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'El número de orden ingresado no se encontró para este evento. Verifique sus datos.',
            ], 422);
        }

        // Determine if payment method is card
        $paymentMethod = strtolower($purchase->payment_method ?? '');
        $isCard = ! empty($purchase->card_last_four) ||
            str_contains($paymentMethod, 'card') ||
            str_contains($paymentMethod, 'webuser') ||
            str_contains($paymentMethod, 'tarjeta');

        $buyerName = $purchase->buyer_name ?? '';
        $isTaquilla = ! $isCard || empty($buyerName) || str_contains(strtolower($buyerName), 'taquilla') || str_contains(strtolower($buyerName), 'box office');
        if ($isTaquilla && (empty($buyerName) || str_contains(strtolower($buyerName), 'taquilla') || str_contains(strtolower($buyerName), 'box office'))) {
            $buyerName = '';
        }

        // Check if all tickets in the purchase are canceled
        $ticketsDetails = collect($purchase->tickets_details ?? []);
        $allCanceled = $ticketsDetails->isNotEmpty() && $ticketsDetails->every(function ($t) {
            $status = strtolower(trim($t['status'] ?? ''));

            return $status === 'cancelado' || $status === 'cancelada';
        });

        if ($allCanceled) {
            $msg = (! $isTaquilla && $isCard)
                ? 'Su compra web ya está en trámite de reembolso o no es elegible. No es necesario realizar alguna acción, el reembolso se verá reflejado en la misma cuenta de compra en un lapso de entre 5 y 10 días, dependiendo de su banco. Para aclaraciones, WhatsApp al 871 102 4187.'
                : 'Su compra web ya está en trámite de reembolso o no es elegible. No es necesario realizar alguna acción, el reembolso se verá reflejado en la misma cuenta de compra en un lapso de entre 5 y 10 días, dependiendo de su banco. Para aclaraciones, WhatsApp al 871 102 4187.';

            return response()->json([
                'message' => $msg,
            ], 422);
        }

        if ($existingRequests->isNotEmpty()) {
            if (! $isTaquilla && $isCard) {
                // Web Card orders represent the whole purchase, so one active request blocks the entire order.
                return response()->json([
                    'status' => 'already_requested',
                    'message' => 'Su compra web ya está en trámite de reembolso o no es elegible. No es necesario realizar alguna acción, el reembolso se verá reflejado en la misma cuenta de compra en un lapso de entre 5 y 10 días, dependiendo de su banco. Para aclaraciones, WhatsApp al 871 102 4187.',
                ], 422);
            } else {
                // For Taquilla orders (Cash or Card), check if all tickets in the purchase are already requested
                $allPurchaseTickets = $ticketsDetails->map(function ($t) {
                    return strtolower(trim($t['ticket_id'] ?? $t['barcode'] ?? ''));
                })->filter()->unique()->values()->toArray();

                $requestedTickets = [];
                foreach ($existingRequests as $req) {
                    $alreadyValidated = is_string($req->validated_tickets) ? json_decode($req->validated_tickets, true) : $req->validated_tickets;
                    if (is_array($alreadyValidated)) {
                        foreach ($alreadyValidated as $rt) {
                            $requestedTickets[] = strtolower(trim($rt));
                        }
                    }
                }
                $requestedTickets = array_unique($requestedTickets);

                // If the number of uniquely requested tickets is >= the number of tickets in the purchase, block it.
                if (count($allPurchaseTickets) > 0 && count(array_intersect($allPurchaseTickets, $requestedTickets)) >= count($allPurchaseTickets)) {
                    return response()->json([
                        'status' => 'already_requested',
                        'message' => 'Su solicitud de reembolso ya está en trámite o no es elegible. No es necesario realizar alguna acción. Para aclaraciones, WhatsApp al 871 102 4187.',
                    ], 422);
                }
            }
        }

        if ($isTaquilla) {
            // For Taquilla, filter out canceled tickets so they cannot be selected/validated
            $activeTickets = $ticketsDetails->filter(function ($t) {
                $status = strtolower(trim($t['status'] ?? ''));

                return $status !== 'cancelado' && $status !== 'cancelada';
            })->values()->toArray();

            if (empty($activeTickets)) {
                return response()->json([
                    'message' => 'Su solicitud de reembolso ya está en trámite o no es elegible. No es necesario realizar alguna acción. Para aclaraciones, WhatsApp al 871 102 4187.',
                ], 422);
            }

            // Taquilla orders require ticket validation
            return response()->json([
                'status' => 'matched',
                'requires_email' => false,
                'requires_card' => $isCard,
                'requires_tickets' => true,
                'buyer_name' => $buyerName,
                'payment_method' => $purchase->payment_method ?? 'Efectivo',
                'tickets' => $activeTickets,
            ]);
        }

        // Web card purchase (has email)
        return response()->json([
            'status' => 'requires_email',
            'requires_email' => true,
            'requires_card' => true,
            'requires_tickets' => false,
            'buyer_name' => $buyerName,
            'payment_method' => $purchase->payment_method ?? 'Tarjeta',
        ]);
    }

    /**
     * Step 1b: Validate matching email and/or card last four digits.
     */
    public function validateSecondary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refund_event_id' => 'required|exists:refund_events,id',
            'order_number' => 'required|string',
            'email' => 'nullable|email',
            'card_last_four' => 'nullable|string|size:4',
        ]);

        $query = RefundPurchase::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number']);

        $purchase = $query->first();

        if (! $purchase) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'La orden no fue encontrada.',
            ], 422);
        }

        // Validate Email if provided/required
        if (! empty($validated['email']) && $purchase->email !== $validated['email']) {
            return response()->json([
                'status' => 'email_mismatch',
                'message' => 'El correo electrónico ingresado no coincide con el registrado para esta orden de compra.',
            ], 422);
        }

        // Validate Card if provided/required
        if (! empty($validated['card_last_four']) && ! empty($purchase->card_last_four)) {
            $inputCard = str_pad(trim($validated['card_last_four']), 4, '0', STR_PAD_LEFT);
            if ($inputCard !== $purchase->card_last_four) {
                return response()->json([
                    'status' => 'card_mismatch',
                    'message' => 'Los últimos 4 dígitos de la tarjeta no coinciden con los registrados para esta orden.',
                ], 422);
            }
        }

        $buyerName = $purchase->buyer_name ?? '';
        $isTaquilla = empty($buyerName) || str_contains(strtolower($buyerName), 'taquilla') || str_contains(strtolower($buyerName), 'box office');
        if ($isTaquilla) {
            $buyerName = '';
        }

        return response()->json([
            'status' => 'matched',
            'buyer_name' => $buyerName,
            'payment_method' => $purchase->payment_method ?? 'Tarjeta',
            'tickets' => $purchase->tickets_details,
        ]);
    }

    /**
     * Validate an individual ticket ID (or barcode) for cash orders.
     */
    public function validateTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refund_event_id' => 'required|exists:refund_events,id',
            'order_number' => 'required|string',
            'barcode' => 'required|string', // We keep 'barcode' as parameter name for backward compatibility in frontend
        ]);

        $purchase = RefundPurchase::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number'])
            ->first();

        if (! $purchase) {
            return response()->json([
                'message' => 'La orden de compra no existe para este evento.',
            ], 422);
        }

        $tickets = $purchase->tickets_details ?? [];
        $matchedTicket = null;
        $inputVal = strtolower(trim($validated['barcode']));

        foreach ($tickets as $t) {
            $ticketId = strtolower(trim($t['ticket_id'] ?? ''));
            $barcode = strtolower(trim($t['barcode'] ?? ''));

            if ($ticketId === $inputVal || $barcode === $inputVal) {
                $matchedTicket = $t;
                // If it matched by ticket_id, we can set it back for consistency
                if (! isset($matchedTicket['barcode']) || empty($matchedTicket['barcode'])) {
                    $matchedTicket['barcode'] = $matchedTicket['ticket_id'] ?? $inputVal;
                }
                break;
            }
        }

        if (! $matchedTicket) {
            return response()->json([
                'message' => 'El ID de boleto ingresado no pertenece a esta orden de compra.',
            ], 422);
        }

        $ticketStatus = strtolower(trim($matchedTicket['status'] ?? ''));
        if ($ticketStatus === 'cancelado' || $ticketStatus === 'cancelada') {
            return response()->json([
                'message' => 'El boleto ingresado está cancelado y no es elegible para reembolso.',
            ], 422);
        }

        // Check if the ticket has already been requested
        $existingRequests = RefundRequest::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number'])
            ->whereIn('status', ['pending', 'processing', 'approved'])
            ->get();

        foreach ($existingRequests as $req) {
            $alreadyValidated = is_string($req->validated_tickets) ? json_decode($req->validated_tickets, true) : $req->validated_tickets;
            if (is_array($alreadyValidated)) {
                $requestedTickets = array_map(function ($rt) {
                    return strtolower(trim($rt));
                }, $alreadyValidated);
                if (in_array(strtolower(trim($matchedTicket['barcode'])), $requestedTickets) ||
                    (! empty($matchedTicket['ticket_id']) && in_array(strtolower(trim($matchedTicket['ticket_id'])), $requestedTickets))) {
                    return response()->json([
                        'message' => 'Este boleto ya se encuentra en un trámite de reembolso activo.',
                    ], 422);
                }
            }
        }

        return response()->json([
            'status' => 'valid',
            'ticket' => $matchedTicket,
        ]);
    }

    /**
     * Step 2: Submit refund request.
     */
    public function submitRequest(Request $request)
    {
        // First retrieve purchase to dynamically define validation rules
        $purchase = RefundPurchase::where('refund_event_id', $request->refund_event_id)
            ->where('order_number', $request->order_number)
            ->first();

        $isCard = false;
        $isTaquilla = false;

        if ($purchase) {
            $paymentMethod = strtolower($purchase->payment_method ?? '');
            $isCard = ! empty($purchase->card_last_four) ||
                str_contains($paymentMethod, 'card') ||
                str_contains($paymentMethod, 'webuser') ||
                str_contains($paymentMethod, 'tarjeta');

            $buyerName = $purchase->buyer_name ?? '';
            $isTaquilla = ! $isCard || empty($buyerName) || str_contains(strtolower($buyerName), 'taquilla') || str_contains(strtolower($buyerName), 'box office');
        }

        $rules = [
            'refund_event_id' => 'required|exists:refund_events,id',
            'order_number' => 'required|string',
            'email' => 'required|email',
            'buyer_name' => 'required|string|max:255',
            'clabe' => 'required|string|size:18',
            'bank_name' => 'required|string|max:255',
            'ine' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ];

        if ($isCard) {
            $rules['card_last_four'] = 'required|string|size:4';
        }

        if ($isTaquilla) {
            // Taquilla orders (cash or card) require individual tickets
            $rules['ticket_photos'] = 'required|array';
            $rules['ticket_photos.*'] = 'required|file|mimes:jpg,jpeg,png,pdf|max:10240';
            $rules['validated_tickets'] = 'required|array|min:1';
            $rules['validated_tickets.*'] = 'string';
        } else {
            // Web orders
            $rules['tickets'] = 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240';
        }

        $validated = $request->validate($rules);

        // Validate CLABE prefix (first 3 digits)
        $clabePrefix = substr($validated['clabe'], 0, 3);
        $bank = Bank::where('code', $clabePrefix)->first();
        if (! $bank) {
            return back()->withErrors([
                'clabe' => 'El código de banco de la CLABE ingresada no es válido o no está registrado.',
            ])->withInput();
        }
        if (! $bank->enabled) {
            return back()->withErrors([
                'clabe' => "El banco {$bank->name} no está habilitado para recibir reembolsos.",
            ])->withInput();
        }

        // Verify card last four matches if required
        if ($isCard && $purchase && ! empty($purchase->card_last_four)) {
            $inputCard = str_pad(trim($validated['card_last_four'] ?? ''), 4, '0', STR_PAD_LEFT);
            if ($inputCard !== $purchase->card_last_four) {
                return back()->withErrors([
                    'card_last_four' => 'Los últimos 4 dígitos de la tarjeta no coinciden con los registrados para esta orden. Verifique su tarjeta física o digital.',
                ]);
            }
        }

        // Double check canceled status and duplicates
        if ($purchase) {
            $ticketsDetails = collect($purchase->tickets_details ?? []);
            $allCanceled = $ticketsDetails->isNotEmpty() && $ticketsDetails->every(function ($t) {
                $status = strtolower(trim($t['status'] ?? ''));

                return $status === 'cancelado' || $status === 'cancelada';
            });
            if ($allCanceled) {
                return back()->withErrors(['order_number' => 'Esta orden de compra está cancelada y no es elegible para reembolso.']);
            }
        }

        if (! $isTaquilla && $isCard) {
            // Web Card orders
            $existingRequest = RefundRequest::where('refund_event_id', $validated['refund_event_id'])
                ->where('order_number', $validated['order_number'])
                ->whereIn('status', ['pending', 'processing', 'approved'])
                ->first();

            if ($existingRequest) {
                return back()->withErrors(['order_number' => 'Ya existe un trámite activo para esta orden completa.']);
            }
        } else {
            // Validate that no validated_ticket is canceled
            if ($purchase && ! empty($validated['validated_tickets'])) {
                foreach ($validated['validated_tickets'] as $submittingTicket) {
                    $matched = collect($purchase->tickets_details ?? [])->first(function ($t) use ($submittingTicket) {
                        return strtolower(trim($t['barcode'] ?? $t['ticket_id'] ?? '')) === strtolower(trim($submittingTicket));
                    });
                    if ($matched) {
                        $ticketStatus = strtolower(trim($matched['status'] ?? ''));
                        if ($ticketStatus === 'cancelado' || $ticketStatus === 'cancelada') {
                            return back()->withErrors(['order_number' => 'El boleto con ID/Código '.$submittingTicket.' está cancelado y no es elegible para reembolso.']);
                        }
                    }
                }
            }

            // For Taquilla orders, we allow multiple requests for the same order, but NOT the same tickets
            $existingRequests = RefundRequest::where('refund_event_id', $validated['refund_event_id'])
                ->where('order_number', $validated['order_number'])
                ->whereIn('status', ['pending', 'processing', 'approved'])
                ->get();

            foreach ($existingRequests as $req) {
                $alreadyValidated = is_string($req->validated_tickets) ? json_decode($req->validated_tickets, true) : $req->validated_tickets;
                if (is_array($alreadyValidated)) {
                    foreach ($validated['validated_tickets'] as $submittingTicket) {
                        if (in_array($submittingTicket, $alreadyValidated)) {
                            return back()->withErrors(['order_number' => 'El boleto con ID/Código '.$submittingTicket.' ya se encuentra en otro trámite activo.']);
                        }
                    }
                }
            }
        }

        // Store files securely (in private storage)
        $inePath = $request->file('ine')->store('refunds/ine');

        $ticketsPath = null;
        if (! $isTaquilla) {
            // Web Card
            $ticketsPath = $request->hasFile('tickets') ? $request->file('tickets')->store('refunds/tickets') : null;
        } else {
            // Taquilla
            $photosMap = [];
            if ($request->hasFile('ticket_photos')) {
                foreach ($request->file('ticket_photos') as $ticketId => $file) {
                    $photosMap[$ticketId] = $file->store('refunds/tickets');
                }
            }
            $ticketsPath = count($photosMap) > 0 ? json_encode($photosMap) : null;
        }

        $trackingId = null;
        do {
            $trackingId = 'REF-'.strtoupper(\Illuminate\Support\Str::random(8));
        } while (RefundRequest::where('tracking_id', $trackingId)->exists());

        $refundRequest = RefundRequest::create([
            'refund_event_id' => $validated['refund_event_id'],
            'refund_purchase_id' => $purchase?->id,
            'order_number' => $validated['order_number'],
            'tracking_id' => $trackingId,
            'email' => $validated['email'],
            'buyer_name' => mb_strtoupper(trim($validated['buyer_name'])),
            'clabe' => $validated['clabe'],
            'bank_name' => $validated['bank_name'],
            'card_last_four' => $validated['card_last_four'] ?? ($purchase?->card_last_four ?? null),
            'ine_path' => $inePath,
            'tickets_path' => $ticketsPath,
            'validated_tickets' => $validated['validated_tickets'] ?? null,
            'status' => 'pending',
        ]);

        // Send email notification
        if ($refundRequest->email) {
            try {
                Mail::to($refundRequest->email)->send(new RefundStatusMail($refundRequest));
            } catch (\Exception $e) {
                // Fail silently in production
            }
        }

        return redirect()->route('refund.success')->with([
            'order_number' => $validated['order_number'],
            'tracking_id' => $trackingId,
        ]);
    }

    public function showSuccess(): InertiaResponse|\Illuminate\Http\RedirectResponse
    {
        $orderNumber = session('order_number');
        $trackingId = session('tracking_id');

        if (! $orderNumber) {
            return redirect()->route('refund.form');
        }

        return Inertia::render('Public/Refund/Success', [
            'order_number' => $orderNumber,
            'tracking_id' => $trackingId,
        ]);
    }

    /**
     * Public page to check refund status.
     */
    public function showTrackingForm(): InertiaResponse
    {
        $events = RefundEvent::with('externalEvent')
            ->where('status', 'active')
            ->get()
            ->map(function (RefundEvent $refundEvent) {
                return [
                    'id' => $refundEvent->id,
                    'title' => $refundEvent->externalEvent->title ?? 'Evento Desconocido',
                ];
            });

        return Inertia::render('Public/Refund/TrackStatus', [
            'events' => $events,
        ]);
    }

    /**
     * Public action to retrieve refund status details.
     */
    public function trackStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tracking_id' => 'required|string',
        ]);

        $refundRequest = RefundRequest::with('refundEvent.externalEvent')
            ->where('tracking_id', $validated['tracking_id'])
            ->first();

        if (! $refundRequest) {
            return response()->json([
                'message' => 'No se encontró ningún trámite de reembolso registrado para ese código de seguimiento.',
            ], 404);
        }

        return response()->json([
            'status' => $refundRequest->status,
            'buyer_name' => $refundRequest->buyer_name,
            'bank_name' => $refundRequest->bank_name,
            'event_title' => $refundRequest->refundEvent->externalEvent->title ?? 'Evento',
            'order_number' => $refundRequest->order_number,
            'admin_notes' => $refundRequest->admin_notes,
            'created_at' => $refundRequest->created_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Show the public form to update invalid documents.
     */
    public function showUpdateDocumentsForm(Request $request, RefundRequest $refundRequest): InertiaResponse
    {
        if ($refundRequest->status !== 'rejected') {
            abort(403, 'Esta solicitud no requiere corrección de documentos en este momento.');
        }

        $invalidDocs = $this->getInvalidDocuments($refundRequest);

        return Inertia::render('Public/Refund/UpdateDocuments', [
            'refundRequest' => [
                'id' => $refundRequest->id,
                'order_number' => $refundRequest->order_number,
                'buyer_name' => $refundRequest->buyer_name,
                'admin_notes' => $refundRequest->admin_notes,
                'tracking_id' => $refundRequest->tracking_id,
                'invalid_documents' => $invalidDocs,
            ],
        ]);
    }

    /**
     * Handle the update of rejected documents.
     */
    public function updateDocuments(Request $request, RefundRequest $refundRequest)
    {
        if ($refundRequest->status !== 'rejected') {
            abort(403, 'Esta solicitud no requiere corrección de documentos.');
        }

        $invalidDocs = $this->getInvalidDocuments($refundRequest);
        $rules = [];

        if (in_array('ine', $invalidDocs)) {
            $rules['ine'] = 'required|file|mimes:jpg,jpeg,png,pdf|max:10240';
        }
        if (in_array('proof', $invalidDocs)) {
            $rules['proof'] = 'required|file|mimes:jpg,jpeg,png,pdf|max:10240';
        }
        if (in_array('tickets', $invalidDocs)) {
            $rules['tickets'] = 'required|file|mimes:jpg,jpeg,png,pdf|max:10240';
        }

        // Taquilla tickets
        $ticketsToUpdate = [];
        foreach ($invalidDocs as $docKey) {
            if (str_starts_with($docKey, 'ticket_')) {
                $subId = substr($docKey, 7);
                $rules['ticket_photo_'.$subId] = 'required|file|mimes:jpg,jpeg,png,pdf|max:10240';
                $ticketsToUpdate[] = $subId;
            }
        }

        $validated = $request->validate($rules);

        $updates = [];
        $validatedDocs = $refundRequest->validated_documents ?? [];

        if (in_array('ine', $invalidDocs) && $request->hasFile('ine')) {
            $updates['ine_path'] = $request->file('ine')->store('refunds/ine');
            $validatedDocs['ine'] = false;
        }

        if (in_array('proof', $invalidDocs) && $request->hasFile('proof')) {
            $updates['proof_of_payment_path'] = $request->file('proof')->store('refunds/proof');
            $validatedDocs['proof'] = false;
        }

        if (in_array('tickets', $invalidDocs) && $request->hasFile('tickets')) {
            $updates['tickets_path'] = $request->file('tickets')->store('refunds/tickets');
            $validatedDocs['tickets'] = false;
        }

        if (! empty($ticketsToUpdate)) {
            $currentTickets = json_decode($refundRequest->tickets_path, true) ?: [];
            foreach ($ticketsToUpdate as $subId) {
                $inputKey = 'ticket_photo_'.$subId;
                if ($request->hasFile($inputKey)) {
                    $currentTickets[$subId] = $request->file($inputKey)->store('refunds/tickets');
                    $validatedDocs['ticket_'.$subId] = false;
                }
            }
            $updates['tickets_path'] = json_encode($currentTickets);
        }

        // Set request back to pending status for re-review and save
        $updates['status'] = 'pending';
        $updates['validated_documents'] = $validatedDocs;

        // Clear admin notes as they will be re-evaluated
        $updates['admin_notes'] = null;

        $refundRequest->update($updates);

        return redirect()->route('refund.success')->with([
            'order_number' => $refundRequest->order_number,
            'tracking_id' => $refundRequest->tracking_id,
        ]);
    }

    /**
     * Helper to compute invalid/unvalidated documents in a request.
     */
    private function getInvalidDocuments(RefundRequest $refundRequest): array
    {
        $invalid = [];
        $validated = $refundRequest->validated_documents ?? [];

        // INE check
        if (! empty($refundRequest->ine_path) && empty($validated['ine'])) {
            $invalid[] = 'ine';
        }

        // Proof of payment check
        if (! empty($refundRequest->proof_of_payment_path) && empty($validated['proof'])) {
            $invalid[] = 'proof';
        }

        // Tickets check
        if (! empty($refundRequest->tickets_path)) {
            $parsed = null;
            try {
                $parsed = json_decode($refundRequest->tickets_path, true);
            } catch (\Exception $e) {
            }

            if (is_array($parsed)) {
                foreach ($parsed as $subId => $path) {
                    if (empty($validated['ticket_'.$subId])) {
                        $invalid[] = 'ticket_'.$subId;
                    }
                }
            } else {
                if (empty($validated['tickets'])) {
                    $invalid[] = 'tickets';
                }
            }
        }

        return $invalid;
    }
}
