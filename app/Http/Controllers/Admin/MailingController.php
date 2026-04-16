<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendCampaignMailJob;
use App\Models\MailingCampaign;
use App\Models\MailingList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MailingController extends Controller
{
    // ─────────────────────────────────────────────
    // LISTA DE DESTINATARIOS
    // ─────────────────────────────────────────────

    public function contactsIndex(): Response
    {
        $contacts = MailingList::orderBy('name')->paginate(50);

        return Inertia::render('Admin/Mailing/Contacts', [
            'contacts' => $contacts,
        ]);
    }

    public function contactsStore(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:mailing_lists,email',
            'zone'  => 'nullable|string|max:100',
        ]);

        MailingList::create($request->only('name', 'email', 'zone'));

        return back()->with('success', 'Contacto agregado correctamente.');
    }

    /**
     * Importar CSV: name,email,zone
     */
    public function contactsImport(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file    = $request->file('csv_file');
        $handle  = fopen($file->getRealPath(), 'r');
        $header  = fgetcsv($handle); // skip header row

        $imported = 0;
        $skipped  = 0;

        DB::transaction(function () use ($handle, &$imported, &$skipped) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < 2) {
                    $skipped++;
                    continue;
                }

                [$name, $email, $zone] = array_pad($row, 3, null);
                $email = trim(strtolower($email));

                if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $skipped++;
                    continue;
                }

                MailingList::updateOrCreate(
                    ['email' => $email],
                    ['name' => trim($name), 'zone' => $zone ? trim($zone) : null, 'active' => true],
                );

                $imported++;
            }
        });

        fclose($handle);

        return back()->with('success', "Importación completada: {$imported} contactos importados, {$skipped} omitidos.");
    }

    public function contactsDestroy(MailingList $contact)
    {
        $contact->delete();
        return back()->with('success', 'Contacto eliminado.');
    }

    public function contactsToggle(MailingList $contact)
    {
        $contact->update(['active' => ! $contact->active]);
        return back()->with('success', 'Estado actualizado.');
    }

    // ─────────────────────────────────────────────
    // CAMPAÑAS
    // ─────────────────────────────────────────────

    public function campaignsIndex(): Response
    {
        $campaigns = MailingCampaign::latest()->paginate(20);
        $totalContacts = MailingList::active()->count();

        return Inertia::render('Admin/Mailing/Campaigns', [
            'campaigns'     => $campaigns,
            'totalContacts' => $totalContacts,
        ]);
    }

    public function campaignsCreate(): Response
    {
        $totalContacts = MailingList::active()->count();

        return Inertia::render('Admin/Mailing/CampaignForm', [
            'totalContacts' => $totalContacts,
            'defaultMessage' => "Nuevamente es un gusto saludarte, el presente es para informarte que el código de vestimenta para la zona asignada en el evento \"Gala con causa\", será Black Tie, se adjunta como referencia un archivo con imágenes ilustrativas.\n\n¡Gracias por donar!\n\nSaludos",
        ]);
    }

    public function campaignsStore(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'subject'    => 'required|string|max:255',
            'message'    => 'required|string',
            'event_name' => 'nullable|string|max:255',
            'image'      => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('mailing/images', 'public');
        }

        $campaign = MailingCampaign::create([
            'name'             => $request->name,
            'subject'          => $request->subject,
            'message'          => $request->message,
            'event_name'       => $request->event_name,
            'image_path'       => $imagePath,
            'status'           => 'draft',
            'total_recipients' => 0,
            'sent_count'       => 0,
            'failed_count'     => 0,
        ]);

        return redirect()
            ->route('admin.mailing.campaigns.show', $campaign)
            ->with('success', 'Campaña creada. Revísala antes de enviar.');
    }

    public function campaignsShow(MailingCampaign $campaign): Response
    {
        $totalContacts = MailingList::active()->count();

        return Inertia::render('Admin/Mailing/CampaignShow', [
            'campaign'      => $campaign,
            'totalContacts' => $totalContacts,
        ]);
    }

    /**
     * Encola los correos para todos los destinatarios activos.
     */
    public function campaignsSend(MailingCampaign $campaign)
    {
        if (! in_array($campaign->status, ['draft', 'failed'])) {
            return back()->with('error', 'Esta campaña ya fue enviada o está en proceso.');
        }

        $recipients = MailingList::active()->get();

        if ($recipients->isEmpty()) {
            return back()->with('error', 'No hay destinatarios activos en la lista.');
        }

        $campaign->update([
            'status'           => 'queued',
            'total_recipients' => $recipients->count(),
            'sent_count'       => 0,
            'failed_count'     => 0,
            'sent_at'          => null,
        ]);

        foreach ($recipients as $recipient) {
            SendCampaignMailJob::dispatch($campaign, $recipient)
                ->onQueue('emails');
        }

        return back()->with('success', "Se encolaron {$recipients->count()} correos. El worker los irá enviando en segundo plano.");
    }

    public function campaignsDestroy(MailingCampaign $campaign)
    {
        if ($campaign->image_path) {
            Storage::disk('public')->delete($campaign->image_path);
        }
        $campaign->delete();

        return redirect()
            ->route('admin.mailing.campaigns.index')
            ->with('success', 'Campaña eliminada.');
    }
}
