<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendCampaignMailJob;
use App\Models\MailingAudience;
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
    // AUDIENCIAS (LISTAS)
    // ─────────────────────────────────────────────

    public function audiencesIndex(): Response
    {
        $audiences = MailingAudience::withCount('contacts')->orderBy('name')->get();

        return Inertia::render('Admin/Mailing/Audiences', [
            'audiences' => $audiences,
        ]);
    }

    public function audiencesStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        MailingAudience::create($request->all());

        return back()->with('success', 'Lista (Audiencia) creada correctamente.');
    }

    public function audiencesDestroy(MailingAudience $audience)
    {
        $audience->delete();

        return back()->with('success', 'Lista eliminada (los contactos permanecen).');
    }

    // ─────────────────────────────────────────────
    // LISTA DE DESTINATARIOS
    // ─────────────────────────────────────────────

    public function contactsIndex(Request $request): Response
    {
        $audienceId = $request->input('audience_id');

        $query = MailingList::with('audiences')->orderBy('name');

        if ($audienceId) {
            $query->whereHas('audiences', function ($q) use ($audienceId) {
                $q->where('mailing_audiences.id', $audienceId);
            });
        }

        $contacts = $query->paginate(100)->withQueryString();

        return Inertia::render('Admin/Mailing/Contacts', [
            'contacts' => $contacts,
            'audiences' => MailingAudience::orderBy('name')->get(),
            'currentAudienceId' => $audienceId,
        ]);
    }

    public function contactsStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:mailing_lists,email',
            'zone' => 'nullable|string|max:100',
            'audience_id' => 'required|exists:mailing_audiences,id',
        ]);

        $contact = MailingList::create($request->only('name', 'email', 'zone'));
        $contact->audiences()->attach($request->audience_id);

        return back()->with('success', 'Contacto agregado y asignado a la lista.');
    }

    public function contactsImport(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
            'audience_id' => 'required|exists:mailing_audiences,id',
        ]);

        $file = $request->file('csv_file');
        $audienceId = $request->audience_id;
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $imported = 0;
        $skipped = 0;

        DB::transaction(function () use ($handle, $audienceId, &$imported, &$skipped) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < 1) {
                    $skipped++;

                    continue;
                }

                [$email, $name, $zone] = array_pad($row, 3, null);
                $email = trim(strtolower($email ?? ''));
                $name = $name ? trim($name) : explode('@', $email)[0];

                if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $skipped++;

                    continue;
                }

                $contact = MailingList::updateOrCreate(
                    ['email' => $email],
                    ['name' => $name, 'zone' => $zone ? trim($zone) : null, 'active' => true],
                );

                if (! $contact->audiences()->where('mailing_audiences.id', $audienceId)->exists()) {
                    $contact->audiences()->attach($audienceId);
                }

                $imported++;
            }
        });

        fclose($handle);

        return back()->with('success', "Importación completada: {$imported} contactos procesados en la lista.");
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

    public function contactsBulkDestroy(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        MailingList::whereIn('id', $request->ids)->delete();

        return back()->with('success', 'Contactos eliminados correctamente.');
    }

    public function contactsBulkAssign(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'audience_id' => 'required|exists:mailing_audiences,id',
        ]);

        $audience = MailingAudience::findOrFail($request->audience_id);

        foreach ($request->ids as $id) {
            $contact = MailingList::findOrFail($id);
            if (! $contact->audiences()->where('mailing_audiences.id', $audience->id)->exists()) {
                $contact->audiences()->attach($audience->id);
            }
        }

        return back()->with('success', 'Contactos asignados a la lista correctamente.');
    }

    // ─────────────────────────────────────────────
    // CAMPAÑAS
    // ─────────────────────────────────────────────

    public function campaignsIndex(): Response
    {
        $campaigns = MailingCampaign::with('audience')->latest()->paginate(20);

        return Inertia::render('Admin/Mailing/Campaigns', [
            'campaigns' => $campaigns,
        ]);
    }

    public function campaignsCreate(): Response
    {
        return Inertia::render('Admin/Mailing/CampaignForm', [
            'audiences' => MailingAudience::withCount('contacts')->orderBy('name')->get(),
            'defaultMessage' => '',
        ]);
    }

    public function campaignsStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'mailing_audience_id' => 'required|exists:mailing_audiences,id',
            'event_name' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('mailing/images', 'public');
        }

        $campaign = MailingCampaign::create([
            'name' => $request->name,
            'subject' => $request->subject,
            'message' => $request->message,
            'mailing_audience_id' => $request->mailing_audience_id,
            'event_name' => $request->event_name,
            'image_path' => $imagePath,
            'status' => 'draft',
            'total_recipients' => 0,
            'sent_count' => 0,
            'failed_count' => 0,
        ]);

        return redirect()
            ->route('admin.mailing.campaigns.show', $campaign)
            ->with('success', 'Campaña creada. Revísala antes de enviar.');
    }

    public function campaignsShow(MailingCampaign $campaign): Response
    {
        $campaign->load('audience');
        $totalContacts = $campaign->audience ? $campaign->audience->contacts()->active()->count() : 0;

        return Inertia::render('Admin/Mailing/CampaignShow', [
            'campaign' => $campaign,
            'totalContacts' => $totalContacts,
        ]);
    }

    public function campaignsSend(MailingCampaign $campaign)
    {
        if (! in_array($campaign->status, ['draft', 'failed'])) {
            return back()->with('error', 'Esta campaña ya fue enviada o está en proceso.');
        }

        if (! $campaign->mailing_audience_id) {
            return back()->with('error', 'La campaña no tiene una audiencia asignada.');
        }

        $recipients = $campaign->audience->contacts()->active()->get();

        if ($recipients->isEmpty()) {
            return back()->with('error', 'La audiencia seleccionada no tiene contactos activos.');
        }

        $campaign->update([
            'status' => 'queued',
            'total_recipients' => $recipients->count(),
            'sent_count' => 0,
            'failed_count' => 0,
            'sent_at' => null,
        ]);

        foreach ($recipients as $recipient) {
            SendCampaignMailJob::dispatch($campaign, $recipient)
                ->onQueue('emails');
        }

        return back()->with('success', "Se encolaron {$recipients->count()} correos para la audiencia '{$campaign->audience->name}'.");
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
