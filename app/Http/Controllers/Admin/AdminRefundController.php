<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\RefundStatusMail;
use App\Models\ExternalEvent;
use App\Models\RefundEvent;
use App\Models\RefundPurchase;
use App\Models\RefundRequest;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AdminRefundController extends Controller
{
    /**
     * Display a listing of refund events.
     */
    public function eventsIndex(Request $request)
    {
        $refundEvents = RefundEvent::with('externalEvent')
            ->withCount('purchases')
            ->withCount('requests')
            ->get();

        // Get external events not already configured
        $configuredIds = $refundEvents->pluck('external_event_id')->toArray();
        $availableEvents = ExternalEvent::whereNotIn('id', $configuredIds)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Admin/Refunds/EventsIndex', [
            'refundEvents' => $refundEvents,
            'availableEvents' => $availableEvents,
        ]);
    }

    /**
     * Store a new refund event link.
     */
    public function storeEvent(Request $request)
    {
        $validated = $request->validate([
            'external_event_id' => 'required|exists:external_events,id|unique:refund_events,external_event_id',
            'status' => 'required|in:active,inactive',
        ]);

        RefundEvent::create($validated);

        return back()->with('success', 'Configuración de reembolso creada correctamente.');
    }

    /**
     * Toggle status of a refund event.
     */
    public function toggleEvent(RefundEvent $event)
    {
        $event->update([
            'status' => $event->status === 'active' ? 'inactive' : 'active',
        ]);

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    /**
     * Delete a refund event and all its related data.
     */
    public function destroyEvent(RefundEvent $event)
    {
        $event->delete();

        return back()->with('success', 'El evento de reembolso y todos sus registros asociados han sido eliminados correctamente.');
    }

    /**
     * Import purchase list from CSV.
     */
    public function uploadCsv(Request $request, RefundEvent $event)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:20480', // 20MB Max
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');

        // Helper to convert encoding (the file from Excel is typically ISO-8859-1 / Windows-1252)
        $sanitizeStr = function (?string $value) {
            if ($value === null || $value === '') {
                return '';
            }
            $encoding = mb_detect_encoding($value, 'UTF-8, ISO-8859-1, Windows-1252', true);
            if (! $encoding) {
                $encoding = 'ISO-8859-1';
            }
            $utf8 = mb_convert_encoding($value, 'UTF-8', $encoding);

            return trim(trim($utf8, '"'));
        };

        // Parse header row
        $headerRow = fgetcsv($handle);
        if (! $headerRow) {
            fclose($handle);

            return back()->withErrors(['file' => 'El archivo CSV está vacío o tiene un formato no válido.']);
        }

        // Clean headers to find indexes
        $headers = array_map(function ($h) use ($sanitizeStr) {
            return strtolower($sanitizeStr($h));
        }, $headerRow);

        // Find positions dynamically (to prevent failures if column ordering changes)
        $findIdx = function ($keys) use ($headers) {
            foreach ($keys as $k) {
                $idx = array_search(strtolower($k), $headers);
                if ($idx !== false) {
                    return $idx;
                }
            }

            return null;
        };

        $ticketIdIdx = $findIdx(['id', 'id_boleto', 'boleto_id', 'id_ticket', 'ticket_id']);
        $orderIdx = $findIdx(['orderid', 'order_id', 'id_orden', 'orden']);
        $emailIdx = $findIdx(['email_envío', 'email_envo', 'email', 'correo', 'email_envio']);
        $companyIdx = $findIdx(['nombre_compañía', 'nombre_compaa', 'compañia', 'nombre']);
        $lastNameIdx = $findIdx(['apellido_envío', 'apellido_envo', 'apellido']);
        $paymentIdx = $findIdx(['tipo_de_pago', 'tipo_pago', 'payment_type', 'metodo_pago']);
        $priceIdx = $findIdx(['precio']);
        $cxsIdx = $findIdx(['cxs']);
        $tcIdx = $findIdx(['tc']);
        $cxadmIdx = $findIdx(['cxadm']);
        $cardLastFourIdx = $findIdx(['tc4ult_dígitos', 'tc4ult_dgitos', 'tc4ult', 'ultimos_4', 'tc_4', 'last_4', 'last4']);
        $barcodeIdx = $findIdx(['barcode', 'codigo_barras', 'codigo_barra', 'codigobarras']);
        $areaIdx = $findIdx(['nombre_rel_area', 'area', 'seccion', 'zona']);
        $seatIdx = $findIdx(['numero_asiento', 'asiento', 'seat']);
        $statusIdx = $findIdx(['estatus_compra', 'estatus_de_compra', 'estatus', 'purchase_status', 'estatus de compra', 'compra_estatus', 'estado', 'estado_compra']);

        // Check if essential OrderID column exists
        if ($orderIdx === null) {
            fclose($handle);

            return back()->withErrors(['file' => 'No se encontró la columna "OrderID" en el archivo CSV.']);
        }

        // Group rows in memory by OrderID
        $orders = [];

        while (($row = fgetcsv($handle)) !== false) {
            // Safe helper to extract columns
            $getColVal = function (?int $idx) use ($row, $sanitizeStr) {
                if ($idx === null || ! isset($row[$idx])) {
                    return '';
                }

                return $sanitizeStr($row[$idx]);
            };

            $orderId = $getColVal($orderIdx);
            if (empty($orderId)) {
                continue;
            }

            $email = $emailIdx !== null ? $getColVal($emailIdx) : '';
            $company = $companyIdx !== null ? $getColVal($companyIdx) : '';
            $lastName = $lastNameIdx !== null ? $getColVal($lastNameIdx) : '';
            $paymentMethod = $paymentIdx !== null ? $getColVal($paymentIdx) : '';

            // Clean price strings (e.g. "$1,450.00" -> 1450.00)
            $cleanPrice = function (string $val) {
                return (float) str_replace(['$', ',', ' '], '', $val);
            };

            $price = $priceIdx !== null ? $cleanPrice($getColVal($priceIdx)) : 0.0;
            $cxs = $cxsIdx !== null ? $cleanPrice($getColVal($cxsIdx)) : 0.0;
            $tc = $tcIdx !== null ? $cleanPrice($getColVal($tcIdx)) : 0.0;
            $cxadm = $cxadmIdx !== null ? $cleanPrice($getColVal($cxadmIdx)) : 0.0;

            $totalItemCost = $price + $cxs + $tc + $cxadm;

            $ticketId = $ticketIdIdx !== null ? $getColVal($ticketIdIdx) : '';
            $barcode = $barcodeIdx !== null ? $getColVal($barcodeIdx) : '';
            $area = $areaIdx !== null ? $getColVal($areaIdx) : '';
            $seat = $seatIdx !== null ? $getColVal($seatIdx) : '';
            $purchaseStatus = $statusIdx !== null ? $getColVal($statusIdx) : '';

            $rawCardLastFour = $cardLastFourIdx !== null ? $getColVal($cardLastFourIdx) : '';
            $cardLastFour = '';
            if ($rawCardLastFour !== '') {
                $cardLastFour = str_pad($rawCardLastFour, 4, '0', STR_PAD_LEFT);
            }

            $buyerName = mb_strtoupper(trim($company.' '.$lastName));
            if (empty($buyerName)) {
                $buyerName = 'COMPRADOR TAQUILLA';
            }

            if (! isset($orders[$orderId])) {
                $orders[$orderId] = [
                    'refund_event_id' => $event->id,
                    'order_number' => $orderId,
                    'email' => $email,
                    'buyer_name' => $buyerName,
                    'payment_method' => $paymentMethod,
                    'card_last_four' => $cardLastFour,
                    'amount' => 0.0,
                    'tickets_details' => [],
                ];
            }

            $orders[$orderId]['amount'] += $totalItemCost;
            $orders[$orderId]['tickets_details'][] = [
                'ticket_id' => $ticketId,
                'barcode' => $barcode,
                'area' => $area,
                'seat' => $seat,
                'price' => $price,
                'cxs' => $cxs,
                'tc' => $tc,
                'cxadm' => $cxadm,
                'total' => $totalItemCost,
                'status' => $purchaseStatus,
            ];
        }

        fclose($handle);

        $orderNumbers = array_keys($orders);
        $conflictingOrder = RefundPurchase::whereIn('order_number', $orderNumbers)
            ->where('refund_event_id', '!=', $event->id)
            ->first();

        if ($conflictingOrder) {
            return back()->withErrors(['csv_file' => "Error: El archivo contiene órdenes que ya han sido asignadas a otro evento (Ej: Orden #{$conflictingOrder->order_number}). Verifica que el archivo sea el correcto."]);
        }

        // Save to DB (overwriting/updating list without deleting existing requests)
        DB::transaction(function () use ($orders) {
            foreach ($orders as $order) {
                RefundPurchase::updateOrCreate(
                    [
                        'refund_event_id' => $order['refund_event_id'],
                        'order_number' => $order['order_number'],
                    ],
                    [
                        'email' => empty($order['email']) ? null : $order['email'],
                        'buyer_name' => $order['buyer_name'],
                        'payment_method' => $order['payment_method'],
                        'card_last_four' => $order['card_last_four'],
                        'amount' => $order['amount'],
                        'tickets_details' => $order['tickets_details'],
                    ]
                );
            }
        });

        $count = count($orders);

        return back()->with('success', "Se han importado {$count} órdenes de compra correctamente.");
    }

    /**
     * Process bulk validation from CSV file.
     */
    public function processMassRefundValidation(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');

        $sanitizeStr = function (?string $value) {
            if ($value === null || $value === '') {
                return '';
            }
            $encoding = mb_detect_encoding($value, 'UTF-8, ISO-8859-1, Windows-1252', true);
            if (! $encoding) {
                $encoding = 'ISO-8859-1';
            }
            $utf8 = mb_convert_encoding($value, 'UTF-8', $encoding);

            return trim(trim($utf8, '"'));
        };

        $headerRow = fgetcsv($handle);
        if (! $headerRow) {
            fclose($handle);

            return back()->withErrors(['file' => 'El archivo CSV está vacío o tiene un formato no válido.']);
        }

        $headers = array_map(function ($h) use ($sanitizeStr) {
            return strtolower($sanitizeStr($h));
        }, $headerRow);

        // Find the index of the order number column
        $orderIdx = null;
        $orderKeys = ['orden', 'order', 'orderid', 'order_id', 'id_orden', 'id_order', 'it'];
        foreach ($orderKeys as $key) {
            $idx = array_search(strtolower($key), $headers);
            if ($idx !== false) {
                $orderIdx = $idx;
                break;
            }
        }

        if ($orderIdx === null) {
            fclose($handle);

            return back()->withErrors(['file' => 'No se encontró la columna "ORDEN" o "OrderID" en el archivo CSV.']);
        }

        // Exceptions list (orders that must not be changed)
        $exceptions = ['2124310', '2109161', '2115690', '2108832'];

        $ordersInCsv = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (! isset($row[$orderIdx])) {
                continue;
            }
            $orderNum = trim($sanitizeStr($row[$orderIdx]));
            if ($orderNum !== '') {
                $ordersInCsv[] = $orderNum;
            }
        }
        fclose($handle);

        $ordersInCsv = array_unique($ordersInCsv);

        // Filter out the exceptions
        $ordersToProcess = array_filter($ordersInCsv, function ($orderNum) use ($exceptions) {
            return ! in_array($orderNum, $exceptions);
        });

        if (empty($ordersToProcess)) {
            return back()->with('success', 'El proceso masivo finalizó. No se encontraron órdenes válidas para procesar.');
        }

        // Now update the refund requests
        $updatedCount = 0;
        $refundRequests = RefundRequest::whereIn('order_number', $ordersToProcess)
            ->where('status', '!=', 'approved') // Only change if not already approved
            ->where('status', '!=', 'rejected') // Or totally rejected, following isActiveOrPendingCorrection rules
            ->get();

        DB::transaction(function () use ($refundRequests, &$updatedCount) {
            foreach ($refundRequests as $req) {
                // Determine which docs to validate based on tickets_path, clabe, etc.
                $validatedDocs = [];
                if (! empty($req->clabe)) {
                    $validatedDocs['clabe'] = true;
                }
                if (! empty($req->ine_path)) {
                    $validatedDocs['ine'] = true;
                }
                // Proof is NOT validated yet, so proof = false
                $validatedDocs['proof'] = false;

                if (! empty($req->tickets_path)) {
                    $parsed = null;
                    try {
                        $parsed = json_decode($req->tickets_path, true);
                    } catch (\Exception $e) {
                    }

                    if (is_array($parsed)) {
                        foreach ($parsed as $subId => $path) {
                            $validatedDocs['ticket_'.$subId] = true;
                        }
                    } else {
                        $validatedDocs['tickets'] = true;
                    }
                }

                $oldStatus = $req->status;
                $req->update([
                    'status' => 'validation_banco_masivo',
                    'validated_documents' => $validatedDocs,
                ]);

                $req->histories()->create([
                    'user_id' => request()->user()?->id,
                    'action' => 'csv_import',
                    'description' => 'Estado cambiado a "validation_banco_masivo" por importación masiva de CSV.',
                    'details' => [
                        'old_status' => $oldStatus,
                        'new_status' => 'validation_banco_masivo',
                    ],
                ]);

                // Send email
                if ($req->email) {
                    try {
                        Mail::to($req->email)->send(new RefundStatusMail($req));
                    } catch (\Exception $e) {
                        // Silence mail errors to prevent process aborting
                    }
                }

                $updatedCount++;
            }
        });

        return back()->with('success', "Proceso masivo completado. Se actualizaron {$updatedCount} solicitudes al estado 'Validación Banco Masivo'.");
    }

    /**
     * Display customer refund requests.
     */
    public function requestsIndex(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $refundEventId = $request->input('refund_event_id');
        $sortDirection = $request->input('sort_direction', 'asc');

        if (! in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }

        $query = RefundRequest::with(['refundEvent.externalEvent', 'refundPurchase', 'histories.user']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('buyer_name', 'like', "%{$search}%")
                    ->orWhere('clabe', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($refundEventId) {
            $query->where('refund_event_id', $refundEventId);
        }

        $requests = $query->orderBy('created_at', $sortDirection)->paginate(20)->withQueryString();
        $refundEvents = RefundEvent::with('externalEvent')->get();

        return Inertia::render('Admin/Refunds/RequestsIndex', [
            'requests' => $requests,
            'refundEvents' => $refundEvents,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'refund_event_id' => $refundEventId,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Update status of a refund request.
     */
    public function updateRequestStatus(Request $request, RefundRequest $refundRequest)
    {
        if ($refundRequest->isTotallyRejected()) {
            return back()->withErrors([
                'status' => 'Esta solicitud de reembolso ha sido rechazada definitivamente y no se puede modificar.',
            ]);
        }

        $original = [
            'status' => $refundRequest->status,
            'buyer_name' => $refundRequest->buyer_name,
            'admin_notes' => $refundRequest->admin_notes,
            'validated_documents' => $refundRequest->validated_documents,
            'include_charges' => $refundRequest->include_charges,
            'proof_of_payment_path' => $refundRequest->proof_of_payment_path,
        ];

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,validation_banco_masivo,approved,rejected',
            'admin_notes' => 'nullable|string',
            'validated_documents' => 'nullable|array',
            'include_charges' => 'nullable|boolean',
            'proof_of_payment' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:10240',
            'buyer_name' => 'nullable|string|max:255',
        ]);

        if ($request->has('buyer_name')) {
            $refundRequest->buyer_name = mb_strtoupper(trim($request->input('buyer_name')));
            $refundRequest->save();
        }

        if ($request->hasFile('proof_of_payment')) {
            $path = $request->file('proof_of_payment')->store('refunds/proofs');
            $refundRequest->proof_of_payment_path = $path;
            $refundRequest->save();
        }

        $newStatus = $validated['status'];
        $validatedDocs = $validated['validated_documents'] ?? [];

        if ($newStatus === 'approved') {
            if (empty($refundRequest->proof_of_payment_path)) {
                return back()->withErrors([
                    'proof_of_payment' => 'Es obligatorio adjuntar el comprobante de transferencia para aprobar el reembolso.',
                ]);
            }
            $validatedDocs['proof'] = true;
        }

        if (in_array($newStatus, ['processing', 'validation_banco_masivo', 'approved'])) {
            $invalidDocs = [];
            if (! empty($refundRequest->clabe) && empty($validatedDocs['clabe'])) {
                $invalidDocs[] = 'Cuenta CLABE Interbancaria';
            }
            if (! empty($refundRequest->ine_path) && empty($validatedDocs['ine'])) {
                $invalidDocs[] = 'INE / Pasaporte';
            }
            if (! empty($refundRequest->proof_of_payment_path) && empty($validatedDocs['proof'])) {
                $invalidDocs[] = 'Comprobante de Pago';
            }
            if (! empty($refundRequest->tickets_path)) {
                $parsed = null;
                try {
                    $parsed = json_decode($refundRequest->tickets_path, true);
                } catch (\Exception $e) {
                }

                if (is_array($parsed)) {
                    foreach ($parsed as $subId => $path) {
                        if (empty($validatedDocs['ticket_'.$subId])) {
                            $invalidDocs[] = 'Boleto '.$subId;
                        }
                    }
                } else {
                    if (empty($validatedDocs['tickets'])) {
                        $invalidDocs[] = 'Boletos Físicos';
                    }
                }
            }

            if (! empty($invalidDocs)) {
                return back()->withErrors([
                    'status' => 'No es posible pasar a este estado hasta que todos los datos y documentos sean marcados como válidos. Pendientes: '.implode(', ', $invalidDocs),
                ]);
            }
        }

        $refundRequest->update([
            'status' => $validated['status'],
            'admin_notes' => $validated['admin_notes'] ?? $refundRequest->admin_notes,
            'validated_documents' => $validatedDocs,
            'include_charges' => $request->boolean('include_charges'),
        ]);

        $changes = [];
        $descriptions = [];
        $adminName = $request->user()?->name ?? 'Administrador';

        if ($original['status'] !== $refundRequest->status) {
            $changes['status'] = ['old' => $original['status'], 'new' => $refundRequest->status];
            $descriptions[] = "Estado cambiado de '{$original['status']}' a '{$refundRequest->status}'";
        }
        if ($original['buyer_name'] !== $refundRequest->buyer_name) {
            $changes['buyer_name'] = ['old' => $original['buyer_name'], 'new' => $refundRequest->buyer_name];
            $descriptions[] = "Nombre del beneficiario modificado a '{$refundRequest->buyer_name}'";
        }
        if ($original['admin_notes'] !== $refundRequest->admin_notes) {
            $changes['admin_notes'] = ['old' => $original['admin_notes'], 'new' => $refundRequest->admin_notes];
            $descriptions[] = 'Notas de administrador modificadas';
        }
        if ($original['include_charges'] !== $refundRequest->include_charges) {
            $changes['include_charges'] = ['old' => $original['include_charges'], 'new' => $refundRequest->include_charges];
            $descriptions[] = 'Incluir cargos de servicio cambiado a '.($refundRequest->include_charges ? 'Sí' : 'No');
        }
        if ($original['proof_of_payment_path'] !== $refundRequest->proof_of_payment_path) {
            $changes['proof_of_payment_path'] = ['old' => $original['proof_of_payment_path'], 'new' => $refundRequest->proof_of_payment_path];
            $descriptions[] = 'Comprobante de pago cargado/actualizado';
        }
        if ($original['validated_documents'] != $refundRequest->validated_documents) {
            $changes['validated_documents'] = ['old' => $original['validated_documents'], 'new' => $refundRequest->validated_documents];
            $descriptions[] = 'Documentos/boletos validados actualizados';
        }

        if (! empty($changes)) {
            $refundRequest->histories()->create([
                'user_id' => $request->user()?->id,
                'action' => 'status_updated',
                'description' => "Modificado por {$adminName}: ".implode(', ', $descriptions),
                'details' => $changes,
            ]);
        }

        // Send status update notification email if email is registered
        if ($refundRequest->email) {
            try {
                Mail::to($refundRequest->email)->send(new RefundStatusMail($refundRequest));
            } catch (\Exception $e) {
                // Fail silently to prevent administrative page crash
            }
        }

        return back()->with('success', 'El estado del reembolso ha sido actualizado.');
    }

    /**
     * Securely serve uploaded document files to authenticated admin users.
     */
    public function downloadFile(Request $request, RefundRequest $refundRequest, string $type)
    {
        $subId = $request->query('subId');

        $path = match ($type) {
            'ine' => $refundRequest->ine_path,
            'proof' => $refundRequest->proof_of_payment_path,
            'tickets' => $subId
                ? (json_decode($refundRequest->tickets_path, true)[$subId] ?? null)
                : $refundRequest->tickets_path,
            default => null,
        };

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404, 'El archivo solicitado no existe o fue eliminado.');
        }

        // Return streaming response compatible with fake disk in tests
        return Storage::disk('local')->response($path, basename($path), [
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
        ]);
    }

    /**
     * Splits a Spanish full name into its constituent parts:
     * Nombre, Segundo Nombre, Apellido Paterno, Apellido Materno.
     */
    private function splitSpanishName(?string $fullName): array
    {
        if (empty($fullName)) {
            return [
                'nombre' => '',
                'segundo_nombre' => '',
                'apellido_paterno' => '',
                'apellido_materno' => '',
            ];
        }

        $name = trim(preg_replace('/\s+/', ' ', $fullName));
        $parts = explode(' ', $name);

        $nombre = '';
        $segundoNombre = '';
        $apellidoPaterno = '';
        $apellidoMaterno = '';

        $count = count($parts);
        if ($count === 1) {
            $nombre = $parts[0];
        } elseif ($count === 2) {
            $nombre = $parts[0];
            $apellidoPaterno = $parts[1];
        } elseif ($count === 3) {
            $nombre = $parts[0];
            $apellidoPaterno = $parts[1];
            $apellidoMaterno = $parts[2];
        } else {
            // 4 or more parts
            $nombre = $parts[0];
            // Middle name is everything between first name and last 2 parts
            $middleParts = array_slice($parts, 1, $count - 3);
            $segundoNombre = implode(' ', $middleParts);
            $apellidoPaterno = $parts[$count - 2];
            $apellidoMaterno = $parts[$count - 1];
        }

        return [
            'nombre' => $nombre,
            'segundo_nombre' => $segundoNombre,
            'apellido_paterno' => $apellidoPaterno,
            'apellido_materno' => $apellidoMaterno,
        ];
    }

    /**
     * Export refund requests to CSV matching the accounting REEMBOLSOS BLT structure.
     */
    public function exportCsv(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status') ?: 'processing';
        $refundEventId = $request->input('refund_event_id');
        $splitNames = $request->boolean('split_names');
        $exportFilter = $request->input('export_filter', 'all');

        $query = RefundRequest::with(['refundEvent.externalEvent', 'refundPurchase']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('buyer_name', 'like', "%{$search}%")
                    ->orWhere('clabe', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($refundEventId) {
            $query->where('refund_event_id', $refundEventId);
        }

        if ($exportFilter === 'new') {
            $query->where('exported', false);
        }

        $requests = $query->orderBy('created_at', 'asc')->get();

        if ($requests->isNotEmpty()) {
            RefundRequest::whereIn('id', $requests->pluck('id'))->update(['exported' => true]);
        }

        $filename = 'ReportRefunds_'.date('Y-m-d_H-i-s').'.csv';

        return response()->streamDownload(function () use ($requests, $splitNames) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header matching exact structure from REEMBOLSOS BLT
            $headers = [
                'IT',
                'ORDEN',
                'EVENTO',
            ];

            if ($splitNames) {
                $headers[] = 'PRIMER NOMBRE';
                $headers[] = 'SEGUNDO NOMBRE';
                $headers[] = 'APELLIDO PATERNO';
                $headers[] = 'APELLIDO MATERNO';
            } else {
                $headers[] = 'NOMBRE DEL TITULAR DE LA TARJETA';
            }

            $headers = array_merge($headers, [
                'TC/CL INT',
                'C/D',
                'BANCO',
                'SC/CC',
                'Blts',
                'Precio',
                'MONTO',
                'Correo',
                'ATN',
                'Fec Solic',
                'Fec Reembolso',
                'BANCO',
                'Referencia',
                'ORDEN',
                'STATUS',
                'PROFECO',
                'FOLIO',
                'RECIBIDA',
                'AUDIENCIA',
                'OBSERVACION',
            ]);

            fputcsv($handle, $headers);

            foreach ($requests as $idx => $req) {
                $purchase = $req->refundPurchase;
                $allTickets = $purchase?->tickets_details ?? [];

                $isPartial = ! empty($req->validated_tickets) && is_array($req->validated_tickets);
                $validatedList = $isPartial ? array_map(fn ($v) => strtolower(trim((string) $v)), $req->validated_tickets) : [];

                $matchedTickets = $isPartial
                    ? collect($allTickets)->filter(function ($t) use ($validatedList) {
                        return in_array(strtolower(trim((string) ($t['barcode'] ?? ''))), $validatedList)
                            || in_array(strtolower(trim((string) ($t['ticket_id'] ?? ''))), $validatedList);
                    })->values()->all()
                    : $allTickets;

                $targetTickets = count($matchedTickets) > 0 ? $matchedTickets : $allTickets;

                $bltsCount = count($targetTickets) > 0 ? count($targetTickets) : 1;

                $includeCharges = (bool) ($req->include_charges ?? false);
                $scCc = $includeCharges ? 'CC' : 'SC';

                if (count($targetTickets) > 0) {
                    $priceTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
                    $cxsTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxs'] ?? 0));
                    $tcTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['tc'] ?? 0));
                    $cxadmTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxadm'] ?? 0));
                    $chargesTotal = $cxsTotal + $tcTotal + $cxadmTotal;
                } else {
                    $priceTotal = (float) ($purchase?->amount ?? 0);
                    $chargesTotal = 0;
                }

                $montoRefund = $includeCharges ? ($priceTotal + $chargesTotal) : $priceTotal;
                $unitPrice = $bltsCount > 0 ? ($montoRefund / $bltsCount) : $montoRefund;

                $eventTitle = $req->refundEvent?->externalEvent?->title ?? 'DESCONOCIDO';

                $row = [
                    $idx + 1,                                                   // IT
                    $req->order_number,                                         // ORDEN
                    $eventTitle,                                                // EVENTO
                ];

                if ($splitNames) {
                    $split = $this->splitSpanishName($req->buyer_name);
                    $row[] = $split['nombre'];
                    $row[] = $split['segundo_nombre'];
                    $row[] = $split['apellido_paterno'];
                    $row[] = $split['apellido_materno'];
                } else {
                    $row[] = $req->buyer_name;                                  // NOMBRE DEL TITULAR DE LA TARJETA
                }

                $row = array_merge($row, [
                    $req->clabe ?? $req->card_last_four ?? '',                  // TC/CL INT
                    'CLABE',                                                    // C/D
                    $req->bank_name ?? 'NO ESPECIFICADO',                       // BANCO
                    $scCc,                                                      // SC/CC (SC = Sin Cargos, CC = Con Cargos)
                    $bltsCount,                                                 // Blts
                    number_format($unitPrice, 2, '.', ''),                      // Precio
                    number_format($montoRefund, 2, '.', ''),                    // MONTO
                    $req->email ?? '',                                          // Correo
                    auth()->user()?->name ?? 'ADMIN',                           // ATN
                    $req->created_at ? $req->created_at->format('d/m/Y') : '',  // Fec Solic
                    $req->updated_at && $req->status === 'approved' ? $req->updated_at->format('d/m/Y') : '', // Fec Reembolso
                    $req->bank_name ?? '',                                      // BANCO
                    '',                                                         // Referencia
                    '',                                                         // ORDEN (R - para control interno)
                    '',                                                         // STATUS (S - para control interno)
                    '',                                                         // PROFECO
                    '',                                                         // FOLIO
                    '',                                                         // RECIBIDA
                    '',                                                         // AUDIENCIA
                    '',                                                         // OBSERVACION (X - para control interno)
                ]);

                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Display a report of all purchases/orders loaded for a refund event.
     */
    public function eventOrdersReport(Request $request, RefundEvent $event)
    {
        $event->load('externalEvent');

        $search = $request->input('search');
        $filterType = $request->input('filter_type', 'all');

        $requests = RefundRequest::where('refund_event_id', $event->id)
            ->get()
            ->keyBy('order_number');

        $allPurchases = RefundPurchase::where('refund_event_id', $event->id)->get();

        $mappedPurchases = $allPurchases->map(function ($purchase) use ($requests) {
            $tickets = collect($purchase->tickets_details ?? []);
            $isCancelled = $tickets->isNotEmpty() && $tickets->every(function ($t) {
                $status = strtolower(trim($t['status'] ?? ''));

                return $status === 'cancelado' || $status === 'cancelada';
            });

            $purchaseRequest = $requests->get($purchase->order_number);

            $refundAmount = 0.0;
            $includeCharges = false;
            if ($purchaseRequest) {
                $includeCharges = (bool) ($purchaseRequest->include_charges ?? false);
                $validatedTickets = $purchaseRequest->validated_tickets ?? [];

                $allTickets = $purchase->tickets_details ?? [];
                $targetTickets = [];
                if (! empty($validatedTickets)) {
                    $targetTickets = array_filter($allTickets, function ($t) use ($validatedTickets) {
                        return in_array($t['ticket_id'] ?? $t['barcode'] ?? '', $validatedTickets);
                    });
                }

                if (empty($targetTickets)) {
                    $targetTickets = $allTickets;
                }

                $priceTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
                $cxsTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxs'] ?? 0));
                $tcTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['tc'] ?? 0));
                $cxadmTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxadm'] ?? 0));
                $chargesTotal = $cxsTotal + $tcTotal + $cxadmTotal;

                $refundAmount = $includeCharges ? ($priceTotal + $chargesTotal) : $priceTotal;
            } else {
                $activeTickets = array_filter($purchase->tickets_details ?? [], function ($t) {
                    $status = strtolower(trim($t['status'] ?? ''));

                    return $status !== 'cancelado' && $status !== 'cancelada';
                });

                $refundAmount = collect($activeTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
            }

            return [
                'id' => $purchase->id,
                'order_number' => $purchase->order_number,
                'email' => $purchase->email,
                'buyer_name' => $purchase->buyer_name,
                'payment_method' => $purchase->payment_method,
                'card_last_four' => $purchase->card_last_four,
                'amount' => $purchase->amount,
                'tickets_details' => $purchase->tickets_details,
                'is_cancelled' => $isCancelled,
                'request_status' => $purchaseRequest ? $purchaseRequest->status : null,
                'request_id' => $purchaseRequest ? $purchaseRequest->id : null,
                'refund_amount' => $refundAmount,
                'include_charges' => $includeCharges,
            ];
        });

        $totalOrdersCount = $mappedPurchases->count();
        $cancelledOrdersCount = $mappedPurchases->where('is_cancelled', true)->count();
        $validOrdersCount = $totalOrdersCount - $cancelledOrdersCount;

        $approvedRequests = $mappedPurchases->where('request_status', 'approved');
        $approvedRequestsCount = $approvedRequests->count();
        $amountRefunded = (float) $approvedRequests->sum('refund_amount');

        $pendingProcessingRequests = $mappedPurchases->whereIn('request_status', ['pending', 'processing']);
        $pendingProcessingRequestsCount = $pendingProcessingRequests->count();
        $amountPending = (float) $pendingProcessingRequests->sum('refund_amount');

        $rejectedRequests = $mappedPurchases->where('request_status', 'rejected');
        $rejectedRequestsCount = $rejectedRequests->count();
        $amountRejected = (float) $rejectedRequests->sum('refund_amount');

        $totalRequestsCount = $mappedPurchases->whereNotNull('request_status')->count();

        $noRequestPurchases = $mappedPurchases->where('is_cancelled', false)->whereNull('request_status');
        $pendingRegistrationCount = $noRequestPurchases->count();
        $amountRemaining = (float) $noRequestPurchases->sum('refund_amount');

        // Charges breakdown (approved and processing)
        $requestsWithRequest = $mappedPurchases->whereNotNull('request_status')->where('request_status', '!=', 'rejected');
        $requestsWithCharges = $requestsWithRequest->where('include_charges', true);
        $requestsWithoutCharges = $requestsWithRequest->where('include_charges', false);

        $countWithCharges = $requestsWithCharges->count();
        $countWithoutCharges = $requestsWithoutCharges->count();

        $amountWithCharges = (float) $requestsWithCharges->sum('refund_amount');
        $amountWithoutCharges = (float) $requestsWithoutCharges->sum('refund_amount');

        $filteredPurchases = $mappedPurchases;

        if (! empty($search)) {
            $searchLower = strtolower($search);
            $filteredPurchases = $filteredPurchases->filter(function ($p) use ($searchLower) {
                return str_contains(strtolower($p['order_number']), $searchLower) ||
                       str_contains(strtolower($p['email'] ?? ''), $searchLower) ||
                       str_contains(strtolower($p['buyer_name']), $searchLower);
            });
        }

        if ($filterType === 'cancelled') {
            $filteredPurchases = $filteredPurchases->where('is_cancelled', true);
        } elseif ($filterType === 'valid') {
            $filteredPurchases = $filteredPurchases->where('is_cancelled', false);
        } elseif ($filterType === 'with_request') {
            $filteredPurchases = $filteredPurchases->whereNotNull('request_status');
        } elseif ($filterType === 'without_request') {
            $filteredPurchases = $filteredPurchases->where('is_cancelled', false)->whereNull('request_status');
        }

        $perPage = 20;
        $page = (int) $request->input('page', 1);
        $total = $filteredPurchases->count();

        $paginatedItems = $filteredPurchases->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $paginatedItems,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Admin/Refunds/OrdersReport', [
            'event' => $event,
            'purchases' => $paginator,
            'stats' => [
                'total_orders' => $totalOrdersCount,
                'cancelled_orders' => $cancelledOrdersCount,
                'valid_orders' => $validOrdersCount,
                'total_requests' => $totalRequestsCount,
                'approved_requests' => $approvedRequestsCount,
                'pending_processing_requests' => $pendingProcessingRequestsCount,
                'rejected_requests' => $rejectedRequestsCount,
                'pending_registration' => $pendingRegistrationCount,
                'amount_refunded' => $amountRefunded,
                'amount_pending' => $amountPending,
                'amount_rejected' => $amountRejected,
                'amount_remaining' => $amountRemaining,
                'count_with_charges' => $countWithCharges,
                'count_without_charges' => $countWithoutCharges,
                'amount_with_charges' => $amountWithCharges,
                'amount_without_charges' => $amountWithoutCharges,
            ],
            'filters' => [
                'search' => $search,
                'filter_type' => $filterType,
            ],
        ]);
    }

    /**
     * Export all purchases/orders of a refund event to CSV for accounting.
     */
    public function exportEventOrdersCsv(RefundEvent $event, Request $request)
    {
        $event->load('externalEvent');

        $search = $request->input('search');
        $filterType = $request->input('filter_type', 'all');
        $splitNames = $request->boolean('split_names');

        $requests = RefundRequest::where('refund_event_id', $event->id)
            ->get()
            ->keyBy('order_number');

        $allPurchases = RefundPurchase::where('refund_event_id', $event->id)->get();

        $mappedPurchases = $allPurchases->map(function ($purchase) use ($requests) {
            $tickets = collect($purchase->tickets_details ?? []);
            $isCancelled = $tickets->isNotEmpty() && $tickets->every(function ($t) {
                $status = strtolower(trim($t['status'] ?? ''));

                return $status === 'cancelado' || $status === 'cancelada';
            });

            $purchaseRequest = $requests->get($purchase->order_number);

            $refundAmount = 0.0;
            $includeCharges = false;
            if ($purchaseRequest) {
                $includeCharges = (bool) ($purchaseRequest->include_charges ?? false);
                $validatedTickets = $purchaseRequest->validated_tickets ?? [];

                $allTickets = $purchase->tickets_details ?? [];
                $targetTickets = [];
                if (! empty($validatedTickets)) {
                    $targetTickets = array_filter($allTickets, function ($t) use ($validatedTickets) {
                        return in_array($t['ticket_id'] ?? $t['barcode'] ?? '', $validatedTickets);
                    });
                }

                if (empty($targetTickets)) {
                    $targetTickets = $allTickets;
                }

                $priceTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
                $cxsTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxs'] ?? 0));
                $tcTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['tc'] ?? 0));
                $cxadmTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxadm'] ?? 0));
                $chargesTotal = $cxsTotal + $tcTotal + $cxadmTotal;

                $refundAmount = $includeCharges ? ($priceTotal + $chargesTotal) : $priceTotal;
            } else {
                $activeTickets = array_filter($purchase->tickets_details ?? [], function ($t) {
                    $status = strtolower(trim($t['status'] ?? ''));

                    return $status !== 'cancelado' && $status !== 'cancelada';
                });

                $refundAmount = collect($activeTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
            }

            return [
                'purchase' => $purchase,
                'is_cancelled' => $isCancelled,
                'request' => $purchaseRequest,
                'request_status' => $purchaseRequest ? $purchaseRequest->status : null,
                'refund_amount' => $refundAmount,
                'include_charges' => $includeCharges,
            ];
        });

        $filtered = $mappedPurchases;

        if (! empty($search)) {
            $searchLower = strtolower($search);
            $filtered = $filtered->filter(function ($p) use ($searchLower) {
                return str_contains(strtolower($p['purchase']->order_number), $searchLower) ||
                       str_contains(strtolower($p['purchase']->email ?? ''), $searchLower) ||
                       str_contains(strtolower($p['purchase']->buyer_name), $searchLower);
            });
        }

        if ($filterType === 'cancelled') {
            $filtered = $filtered->where('is_cancelled', true);
        } elseif ($filterType === 'valid') {
            $filtered = $filtered->where('is_cancelled', false);
        } elseif ($filterType === 'with_request') {
            $filtered = $filtered->whereNotNull('request_status');
        } elseif ($filterType === 'without_request') {
            $filtered = $filtered->where('is_cancelled', false)->whereNull('request_status');
        }

        $eventTitle = str_replace(' ', '_', $event->externalEvent->title ?? 'evento');
        $filename = "reporte_contable_reembolsos_{$eventTitle}_".date('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($filtered, $splitNames) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            $headers = ['ID ORDEN'];
            if ($splitNames) {
                $headers[] = 'PRIMER NOMBRE COMPRA';
                $headers[] = 'SEGUNDO NOMBRE COMPRA';
                $headers[] = 'APELLIDO PATERNO COMPRA';
                $headers[] = 'APELLIDO MATERNO COMPRA';
            } else {
                $headers[] = 'TITULAR COMPRA';
            }

            $headers = array_merge($headers, [
                'METODO PAGO',
                'ULTIMOS 4',
                'ESTADO COMPRA',
                'ID BOLETO',
                'CODIGO BARRAS',
                'ZONA',
                'ASIENTO',
                'ESTADO BOLETO',
                'PRECIO BASE',
                'CARGO SERVICIO (CxS)',
                'CARGO TARJETA (TC)',
                'CARGO ADMIN (CxAdm)',
                'TOTAL BOLETO',
                'ESTATUS TRAMITE',
                'MONTO REEMBOLSO CALCULADO',
                'CARGOS INCLUIDOS',
            ]);

            if ($splitNames) {
                $headers[] = 'PRIMER NOMBRE TRANSFERENCIA';
                $headers[] = 'SEGUNDO NOMBRE TRANSFERENCIA';
                $headers[] = 'APELLIDO PATERNO TRANSFERENCIA';
                $headers[] = 'APELLIDO MATERNO TRANSFERENCIA';
            } else {
                $headers[] = 'TITULAR CUENTA TRANSFERENCIA';
            }

            $headers = array_merge($headers, [
                'BANCO',
                'CLABE',
                'FECHA SOLICITUD',
                'FECHA APROBACION',
            ]);

            fputcsv($handle, $headers);

            $buildRow = function ($p, $req, $statusLabel, $reqStatus, $item, $splitNames, $ticketData) {
                $row = [$p->order_number];
                if ($splitNames) {
                    $split = $this->splitSpanishName($p->buyer_name);
                    $row[] = $split['nombre'];
                    $row[] = $split['segundo_nombre'];
                    $row[] = $split['apellido_paterno'];
                    $row[] = $split['apellido_materno'];
                } else {
                    $row[] = $p->buyer_name;
                }

                $row = array_merge($row, [
                    $p->payment_method,
                    $p->card_last_four ?? '',
                    $statusLabel,
                    $ticketData['ticket_id'],
                    $ticketData['barcode'],
                    $ticketData['area'],
                    $ticketData['seat'],
                    $ticketData['status'],
                    $ticketData['price'],
                    $ticketData['cxs'],
                    $ticketData['tc'],
                    $ticketData['cxadm'],
                    $ticketData['total'],
                    $reqStatus,
                    number_format((float) $item['refund_amount'], 2, '.', ''),
                    $item['include_charges'] ? 'SI' : 'NO',
                ]);

                if ($splitNames) {
                    $split = $this->splitSpanishName($req ? $req->buyer_name : '');
                    $row[] = $split['nombre'];
                    $row[] = $split['segundo_nombre'];
                    $row[] = $split['apellido_paterno'];
                    $row[] = $split['apellido_materno'];
                } else {
                    $row[] = $req ? $req->buyer_name : '';
                }

                return array_merge($row, [
                    $req ? ($req->bank_name ?? '') : '',
                    $req ? ($req->clabe ?? $req->card_last_four ?? '') : '',
                    $req && $req->created_at ? $req->created_at->format('d/m/Y') : '',
                    $req && $req->status === 'approved' && $req->updated_at ? $req->updated_at->format('d/m/Y') : '',
                ]);
            };

            foreach ($filtered as $item) {
                $p = $item['purchase'];
                $req = $item['request'];
                $statusLabel = $item['is_cancelled'] ? 'CANCELADA' : 'VALIDA';

                $reqStatus = 'SIN SOLICITUD';
                if ($item['request_status']) {
                    $reqStatus = match ($item['request_status']) {
                        'pending' => 'PENDIENTE',
                        'processing' => 'EN TRAMITE',
                        'approved' => 'APROBADO',
                        'rejected' => 'RECHAZADO',
                        default => strtoupper($item['request_status']),
                    };
                }

                $tickets = $p->tickets_details ?? [];
                if (empty($tickets)) {
                    // Fallback row if no ticket details exist
                    $fallbackTicket = [
                        'ticket_id' => 'N/A',
                        'barcode' => 'N/A',
                        'area' => 'N/A',
                        'seat' => 'N/A',
                        'status' => 'N/A',
                        'price' => '0.00',
                        'cxs' => '0.00',
                        'tc' => '0.00',
                        'cxadm' => '0.00',
                        'total' => number_format((float) $p->amount, 2, '.', ''),
                    ];
                    fputcsv($handle, $buildRow($p, $req, $statusLabel, $reqStatus, $item, $splitNames, $fallbackTicket));
                } else {
                    foreach ($tickets as $t) {
                        $ticketData = [
                            'ticket_id' => $t['ticket_id'] ?? 'N/A',
                            'barcode' => $t['barcode'] ?? 'N/A',
                            'area' => $t['area'] ?? 'N/A',
                            'seat' => $t['seat'] ?? 'N/A',
                            'status' => strtoupper($t['status'] ?? 'PAGADO'),
                            'price' => number_format((float) ($t['price'] ?? 0), 2, '.', ''),
                            'cxs' => number_format((float) ($t['cxs'] ?? 0), 2, '.', ''),
                            'tc' => number_format((float) ($t['tc'] ?? 0), 2, '.', ''),
                            'cxadm' => number_format((float) ($t['cxadm'] ?? 0), 2, '.', ''),
                            'total' => number_format((float) ($t['total'] ?? 0), 2, '.', ''),
                        ];
                        fputcsv($handle, $buildRow($p, $req, $statusLabel, $reqStatus, $item, $splitNames, $ticketData));
                    }
                }
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Helper to clean Spanish accents and special characters (like Ñ).
     */
    private function cleanStringForBanamex(?string $str): string
    {
        if (empty($str)) {
            return '';
        }

        $unwanted_array = [
            'Š' => 'S', 'š' => 's', 'Ž' => 'Z', 'ž' => 'z', 'À' => 'A', 'Á' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'A', 'Æ' => 'A', 'Ç' => 'C',
            'È' => 'E', 'É' => 'E', 'Ê' => 'E', 'Ë' => 'E', 'Ì' => 'I', 'Í' => 'I', 'Î' => 'I', 'Ï' => 'I', 'Ñ' => 'N', 'Ò' => 'O', 'Ó' => 'O', 'Ô' => 'O',
            'Õ' => 'O', 'Ö' => 'O', 'Ø' => 'O', 'Ù' => 'U', 'Ú' => 'U', 'Û' => 'U', 'Ü' => 'U', 'Ý' => 'Y', 'Þ' => 'B', 'ß' => 'Ss', 'à' => 'a', 'á' => 'a',
            'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'æ' => 'a', 'ç' => 'c', 'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ì' => 'i', 'í' => 'i',
            'î' => 'i', 'ï' => 'i', 'ð' => 'o', 'ñ' => 'n', 'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ø' => 'o', 'ù' => 'u', 'ú' => 'u',
            'û' => 'u', 'ü' => 'u', 'ý' => 'y', 'þ' => 'b', 'ÿ' => 'y',
        ];

        $str = strtr($str, $unwanted_array);

        // Remove any other character that is not alphanumeric, whitespace, comma, or slash
        $str = preg_replace('/[^A-Za-z0-9\s,\/]/', '', $str);

        return mb_strtoupper(trim($str));
    }

    /**
     * Export refund requests to Banamex Layout in Excel (.xlsx) format.
     */
    public function exportBanamexExcel(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status') ?: 'validation_banco_masivo';
        $refundEventId = $request->input('refund_event_id');
        $exportFilter = $request->input('export_filter', 'all');

        $query = RefundRequest::with(['refundEvent.externalEvent', 'refundPurchase']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('buyer_name', 'like', "%{$search}%")
                    ->orWhere('clabe', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($refundEventId) {
            $query->where('refund_event_id', $refundEventId);
        }

        if ($exportFilter === 'new') {
            $query->where('exported', false);
        }

        $requests = $query->orderBy('created_at', 'asc')->get();

        if ($requests->isNotEmpty()) {
            RefundRequest::whereIn('id', $requests->pluck('id'))->update(['exported' => true]);
        }

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = [
            'Tipo Transacción',
            'Tipo Cuenta Origen',
            'Sucursal Cuenta Origen',
            'Cuenta Origen',
            'Tipo Cuenta Destino',
            'Sucursal Cuenta Destino',
            'Cuenta Destino',
            'Banco Destino',
            'Importe',
            'Moneda',
            'Descripción',
            'Concepto',
            'Referencia',
            'Beneficiario',
            'Plazo',
            'Fecha de aplicación',
            'Hora de aplicación',
            'RFC',
            'IVA',
        ];

        foreach ($headers as $colIndex => $header) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);
            $sheet->setCellValueExplicit($colLetter.'1', $header, DataType::TYPE_STRING);
        }

        $rowIndex = 2;
        foreach ($requests as $req) {
            $purchase = $req->refundPurchase;
            $allTickets = $purchase?->tickets_details ?? [];

            $isPartial = ! empty($req->validated_tickets) && is_array($req->validated_tickets);
            $validatedList = $isPartial ? array_map(fn ($v) => strtolower(trim((string) $v)), $req->validated_tickets) : [];

            $matchedTickets = $isPartial
                ? collect($allTickets)->filter(function ($t) use ($validatedList) {
                    return in_array(strtolower(trim((string) ($t['barcode'] ?? ''))), $validatedList)
                        || in_array(strtolower(trim((string) ($t['ticket_id'] ?? ''))), $validatedList);
                })->values()->all()
                : $allTickets;

            $targetTickets = count($matchedTickets) > 0 ? $matchedTickets : $allTickets;

            $includeCharges = (bool) ($req->include_charges ?? false);

            if (count($targetTickets) > 0) {
                $priceTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['price'] ?? 0));
                $cxsTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxs'] ?? 0));
                $tcTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['tc'] ?? 0));
                $cxadmTotal = collect($targetTickets)->sum(fn ($t) => (float) ($t['cxadm'] ?? 0));
                $chargesTotal = $cxsTotal + $tcTotal + $cxadmTotal;
            } else {
                $priceTotal = (float) ($purchase?->amount ?? 0);
                $chargesTotal = 0;
            }

            $montoRefund = $includeCharges ? ($priceTotal + $chargesTotal) : $priceTotal;

            // Determinar Tipo Transacción (Col A)
            $clabe = trim((string) $req->clabe);
            $isBanamex = str_starts_with($clabe, '002');
            $tipoTransaccion = $isBanamex ? '03' : '09';

            // Banco Destino (Col H)
            $bancoDestino = '';
            if ($tipoTransaccion === '09') {
                $bancoDestino = substr($clabe, 0, 3);
            }

            // Cuenta Destino (Col G)
            $cuentaDestino = str_pad($clabe, 18, '0', STR_PAD_LEFT);

            // Importe (Col I)
            $importe = number_format($montoRefund, 2, '.', '');

            // Descripción (Col K)
            $descripcion = substr($this->cleanStringForBanamex('REEMBOLSO BOLETOS'), 0, 40);

            // Referencia (Col M)
            $referenciaNumerica = preg_replace('/[^0-9]/', '', $req->order_number);
            $referenciaNumerica = substr($referenciaNumerica, -7);

            // Beneficiario (Col N)
            $beneficiario = '';
            if ($tipoTransaccion === '09') {
                $split = $this->splitSpanishName($req->buyer_name);
                $nombres = trim($split['nombre'].' '.$split['segundo_nombre']);
                $paterno = trim($split['apellido_paterno']);
                $materno = trim($split['apellido_materno']);

                $nombresClean = $this->cleanStringForBanamex($nombres);
                $paternoClean = $this->cleanStringForBanamex($paterno);
                $maternoClean = $this->cleanStringForBanamex($materno);

                $beneficiario = substr($nombresClean.','.$paternoClean.'/'.$maternoClean, 0, 55);
            }

            $rowValues = [
                $tipoTransaccion,       // A
                '01',                   // B
                '0930',                 // C
                '7004272',              // D
                '40',                   // E
                '',                     // F
                $cuentaDestino,         // G
                $bancoDestino,          // H
                $importe,               // I
                '001',                  // J
                $descripcion,           // K
                '',                     // L
                $referenciaNumerica,    // M
                $beneficiario,          // N
                '00',                   // O
                '',                     // P
                '',                     // Q
                '',                     // R
                '',                      // S
            ];

            foreach ($rowValues as $colIndex => $value) {
                $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);
                $sheet->setCellValueExplicit($colLetter.$rowIndex, $value, DataType::TYPE_STRING);
            }

            $rowIndex++;
        }

        $filename = 'Reembolsos_Banamex_'.date('Ymd_His').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
