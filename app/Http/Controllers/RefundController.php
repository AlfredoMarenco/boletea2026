<?php

namespace App\Http\Controllers;

use App\Mail\RefundStatusMail;
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

        return Inertia::render('Public/Refund/RefundForm', [
            'events' => $events,
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

        if ($existingRequests->isNotEmpty()) {
            if (! $isTaquilla && $isCard) {
                // Web Card orders represent the whole purchase, so one active request blocks the entire order.
                return response()->json([
                    'status' => 'already_requested',
                    'message' => 'Ya existe un trámite de reembolso registrado y activo para este número de orden.',
                ], 422);
            } else {
                // For Taquilla orders (Cash or Card), check if all tickets in the purchase are already requested
                $allPurchaseTickets = collect($purchase->tickets_details ?? [])->map(function ($t) {
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
                        'message' => 'Todos los boletos de esta orden ya se encuentran en trámites activos.',
                    ], 422);
                }
            }
        }

        if ($isTaquilla) {
            // Taquilla orders require ticket validation
            return response()->json([
                'status' => 'matched',
                'requires_email' => false,
                'requires_card' => $isCard,
                'requires_tickets' => true,
                'buyer_name' => $buyerName,
                'payment_method' => $purchase->payment_method ?? 'Efectivo',
                'tickets' => $purchase->tickets_details,
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

        // Verify card last four matches if required
        if ($isCard && $purchase && ! empty($purchase->card_last_four)) {
            $inputCard = str_pad(trim($validated['card_last_four'] ?? ''), 4, '0', STR_PAD_LEFT);
            if ($inputCard !== $purchase->card_last_four) {
                return back()->withErrors([
                    'card_last_four' => 'Los últimos 4 dígitos de la tarjeta no coinciden con los registrados para esta orden. Verifique su tarjeta física o digital.',
                ]);
            }
        }

        // Double check duplicates
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

        $refundRequest = RefundRequest::create([
            'refund_event_id' => $validated['refund_event_id'],
            'refund_purchase_id' => $purchase?->id,
            'order_number' => $validated['order_number'],
            'email' => $validated['email'],
            'buyer_name' => $validated['buyer_name'],
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

        return redirect()->route('refund.success')->with('order_number', $validated['order_number']);
    }

    public function showSuccess(): InertiaResponse|\Illuminate\Http\RedirectResponse
    {
        $orderNumber = session('order_number');

        if (! $orderNumber) {
            return redirect()->route('refund.form');
        }

        return Inertia::render('Public/Refund/Success', [
            'order_number' => $orderNumber,
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
            'refund_event_id' => 'required|exists:refund_events,id',
            'order_number' => 'required|string',
        ]);

        $refundRequest = RefundRequest::where('refund_event_id', $validated['refund_event_id'])
            ->where('order_number', $validated['order_number'])
            ->first();

        if (! $refundRequest) {
            return response()->json([
                'message' => 'No se encontró ningún trámite de reembolso registrado para ese número de orden.',
            ], 404);
        }

        return response()->json([
            'status' => $refundRequest->status,
            'buyer_name' => $refundRequest->buyer_name,
            'bank_name' => $refundRequest->bank_name,
            'admin_notes' => $refundRequest->admin_notes,
            'created_at' => $refundRequest->created_at->format('Y-m-d H:i:s'),
        ]);
    }
}
