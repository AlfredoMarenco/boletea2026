import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Event, Venue, SeatingMap } from '../types';

interface Props {
    event: Event;
    venues: Venue[];
    seatingMaps: SeatingMap[];
}

export default function CreateShowtimeModal({ event, venues, seatingMaps }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm({
        name: '',
        venue_id: '',
        seating_map_id: '',
        date_time: '',
        end_time: '',
        web_sales_start_at: '',
        web_sales_end_at: '',
        box_office_sales_start_at: '',
        box_office_sales_end_at: '',
        max_tickets_per_cart: 6,
        status: 'draft',
        ticket_notes: '',
        ticket_terms: '',
    });

    const filteredMaps = seatingMaps.filter(
        (map) => !form.data.venue_id || map.venue_id === parseInt(form.data.venue_id)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('admin.local-events.showtimes.store', event.id), {
            onSuccess: () => {
                setIsOpen(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Nueva Función
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Crear Nueva Función (Showtime)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Función / Presentación</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Ej: Función Noche / Gala Inaugural"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estatus Operativo</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(val) => form.setData('status', val)}
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
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venue">Recinto / Sede</Label>
                            <Select
                                value={form.data.venue_id}
                                onValueChange={(val) => {
                                    form.setData({
                                        ...form.data,
                                        venue_id: val,
                                        seating_map_id: '',
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un recinto" />
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
                            <Label htmlFor="seating_map">Mapa de Asientos Base</Label>
                            <Select
                                value={form.data.seating_map_id}
                                onValueChange={(val) => form.setData('seating_map_id', val)}
                                disabled={!form.data.venue_id}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !form.data.venue_id
                                                ? 'Primero selecciona un recinto'
                                                : 'Selecciona un mapa'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredMaps.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_time">Fecha y Hora de Inicio del Show</Label>
                            <Input
                                id="date_time"
                                type="datetime-local"
                                value={form.data.date_time}
                                onChange={(e) => form.setData('date_time', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_time">Fecha y Hora de Finalización</Label>
                            <Input
                                id="end_time"
                                type="datetime-local"
                                value={form.data.end_time}
                                onChange={(e) => form.setData('end_time', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="web_start">Inicio Venta Web</Label>
                            <Input
                                id="web_start"
                                type="datetime-local"
                                value={form.data.web_sales_start_at}
                                onChange={(e) => form.setData('web_sales_start_at', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="web_end">Fin Venta Web</Label>
                            <Input
                                id="web_end"
                                type="datetime-local"
                                value={form.data.web_sales_end_at}
                                onChange={(e) => form.setData('web_sales_end_at', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="box_start">Inicio Venta Taquilla</Label>
                            <Input
                                id="box_start"
                                type="datetime-local"
                                value={form.data.box_office_sales_start_at}
                                onChange={(e) =>
                                    form.setData('box_office_sales_start_at', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="box_end">Fin Venta Taquilla</Label>
                            <Input
                                id="box_end"
                                type="datetime-local"
                                value={form.data.box_office_sales_end_at}
                                onChange={(e) =>
                                    form.setData('box_office_sales_end_at', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="max_tickets">Límite Máximo de Boletos por Compra</Label>
                            <Input
                                id="max_tickets"
                                type="number"
                                min={1}
                                max={50}
                                value={form.data.max_tickets_per_cart}
                                onChange={(e) =>
                                    form.setData('max_tickets_per_cart', parseInt(e.target.value))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold"
                        >
                            Crear Función y Generar Mapa
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
