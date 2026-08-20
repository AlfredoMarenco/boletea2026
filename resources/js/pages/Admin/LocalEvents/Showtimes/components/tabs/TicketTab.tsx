import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event, Showtime } from '../../types';

interface Props {
    event: Event;
    showtime: Showtime;
}

export default function TicketTab({ event, showtime }: Props) {
    const ticketForm = useForm({
        ticket_notes: showtime.ticket_notes || '',
        ticket_terms: showtime.ticket_terms || '',
    });

    const handleSaveTicket = (e: React.FormEvent) => {
        e.preventDefault();
        ticketForm.put(route('admin.local-events.showtimes.update', [event.id, showtime.id]));
    };

    return (
        <form onSubmit={handleSaveTicket} className="space-y-6 w-full">
            <div>
                <h3 className="text-lg font-bold">Impresión de Boletos & Términos</h3>
                <p className="text-xs text-muted-foreground">
                    Configura las leyendas y avisos que se imprimirán en el boleto físico de taquilla para esta función.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t_notes">Notas e Instrucciones del Boleto (Frente/Reverso)</Label>
                <Textarea
                    id="t_notes"
                    rows={3}
                    value={ticketForm.data.ticket_notes}
                    onChange={(e) => ticketForm.setData('ticket_notes', e.target.value)}
                    placeholder="Ej: Presentarse 30 minutos antes. Prohibido el ingreso de alimentos y bebidas..."
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="t_terms">Términos y Condiciones Específicos de la Función</Label>
                <Textarea
                    id="t_terms"
                    rows={4}
                    value={ticketForm.data.ticket_terms}
                    onChange={(e) => ticketForm.setData('ticket_terms', e.target.value)}
                    placeholder="Políticas de cancelación, reembolso o restricciones de edad específicas para esta función..."
                />
            </div>

            <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={ticketForm.processing} className="bg-[#c90000] text-white">
                    Guardar Datos del Boleto
                </Button>
            </div>
        </form>
    );
}
