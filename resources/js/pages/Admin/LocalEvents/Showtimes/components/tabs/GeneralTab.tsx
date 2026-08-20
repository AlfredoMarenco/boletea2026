import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Event, Showtime, Venue, SeatingMap } from '../../types';

interface Props {
    event: Event;
    showtime: Showtime;
    venues: Venue[];
    seatingMaps: SeatingMap[];
}

export default function GeneralTab({ event, showtime, venues, seatingMaps }: Props) {
    const generalForm = useForm({
        name: showtime.name || '',
        venue_id: showtime.venue_id?.toString() || '',
        seating_map_id: showtime.seating_map_id?.toString() || '',
        date_time: showtime.date_time ? showtime.date_time.slice(0, 16) : '',
        end_time: showtime.end_time ? showtime.end_time.slice(0, 16) : '',
        web_sales_start_at: showtime.web_sales_start_at ? showtime.web_sales_start_at.slice(0, 16) : '',
        web_sales_end_at: showtime.web_sales_end_at ? showtime.web_sales_end_at.slice(0, 16) : '',
        box_office_sales_start_at: showtime.box_office_sales_start_at ? showtime.box_office_sales_start_at.slice(0, 16) : '',
        box_office_sales_end_at: showtime.box_office_sales_end_at ? showtime.box_office_sales_end_at.slice(0, 16) : '',
        max_tickets_per_cart: showtime.max_tickets_per_cart || 6,
        status: showtime.status || 'draft',
        ticket_notes: showtime.ticket_notes || '',
        ticket_terms: showtime.ticket_terms || '',
    });

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        generalForm.put(route('admin.local-events.showtimes.update', [event.id, showtime.id]));
    };

    return (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="g_name">Nombre de la Función</Label>
                    <Input
                        id="g_name"
                        value={generalForm.data.name}
                        onChange={(e) => generalForm.setData('name', e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_status">Estado de la Función</Label>
                    <Select
                        value={generalForm.data.status}
                        onValueChange={(val) => generalForm.setData('status', val)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Borrador (Oculto)</SelectItem>
                            <SelectItem value="on_sale">A la Venta (Público)</SelectItem>
                            <SelectItem value="coming_soon">Próximamente</SelectItem>
                            <SelectItem value="web_only">Solo Venta Web</SelectItem>
                            <SelectItem value="box_office_only">Solo Taquilla</SelectItem>
                            <SelectItem value="sold_out">Agotado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="completed">Finalizado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_venue">Recinto / Sede</Label>
                    <Select
                        value={generalForm.data.venue_id}
                        onValueChange={(val) => generalForm.setData('venue_id', val)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {venues.map((v) => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                    {v.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_map">Mapa de Asientos</Label>
                    <Select
                        value={generalForm.data.seating_map_id}
                        onValueChange={(val) => generalForm.setData('seating_map_id', val)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {seatingMaps.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_date">Fecha y Hora de Inicio</Label>
                    <Input
                        id="g_date"
                        type="datetime-local"
                        value={generalForm.data.date_time}
                        onChange={(e) => generalForm.setData('date_time', e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_end">Fecha y Hora de Finalización</Label>
                    <Input
                        id="g_end"
                        type="datetime-local"
                        value={generalForm.data.end_time}
                        onChange={(e) => generalForm.setData('end_time', e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_web_start">Inicio Venta Web</Label>
                    <Input
                        id="g_web_start"
                        type="datetime-local"
                        value={generalForm.data.web_sales_start_at}
                        onChange={(e) => generalForm.setData('web_sales_start_at', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_web_end">Fin Venta Web</Label>
                    <Input
                        id="g_web_end"
                        type="datetime-local"
                        value={generalForm.data.web_sales_end_at}
                        onChange={(e) => generalForm.setData('web_sales_end_at', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_box_start">Inicio Venta Taquilla</Label>
                    <Input
                        id="g_box_start"
                        type="datetime-local"
                        value={generalForm.data.box_office_sales_start_at}
                        onChange={(e) => generalForm.setData('box_office_sales_start_at', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="g_box_end">Fin Venta Taquilla</Label>
                    <Input
                        id="g_box_end"
                        type="datetime-local"
                        value={generalForm.data.box_office_sales_end_at}
                        onChange={(e) => generalForm.setData('box_office_sales_end_at', e.target.value)}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="g_max_tickets">Máximo de Boletos por Carrito / Compra</Label>
                    <Input
                        id="g_max_tickets"
                        type="number"
                        min={1}
                        max={50}
                        value={generalForm.data.max_tickets_per_cart}
                        onChange={(e) => generalForm.setData('max_tickets_per_cart', parseInt(e.target.value))}
                    />
                </div>
            </div>

            <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={generalForm.processing} className="bg-[#c90000] text-white">
                    Guardar Cambios Generales
                </Button>
            </div>
        </form>
    );
}
