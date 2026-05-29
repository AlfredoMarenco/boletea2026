import AppLayout from '@/layouts/app-layout';
import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Smartphone, Shield, ArrowRight } from 'lucide-react';

interface Device {
    id: number;
    name: string;
    device_identifier: string;
}

interface Props {
    event: {
        id: number;
        name: string;
    };
    sections: string[];
    devices: Device[];
    assignments: Record<number, string[]>;
}

export default function Devices({ event, sections, devices, assignments }: Props) {
    // We can handle the form for each device
    const handleSave = (deviceId: number, selectedSections: string[]) => {
        router.post(route('admin.access.events.devices.assign', event.id), {
            device_id: deviceId,
            sections: selectedSections
        }, {
            preserveScroll: true
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Control de Acceso', href: route('admin.access.events.index') },
            { title: event.name, href: route('admin.access.events.stats', event.id) },
            { title: 'Puertas y Dispositivos', href: '#' }
        ]}>
            <Head title={`Puertas - ${event.name}`} />

            <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Configuración de Puertas
                        </h1>
                        <p className="text-gray-500 mt-1">Asigna a cada scanner qué secciones tiene permitido escanear en {event.name}.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.stats', event.id)}>
                                Volver a Estadísticas
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.codes', event.id)}>
                                Ver Códigos
                            </Link>
                        </Button>
                    </div>
                </div>

                {sections.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-2xl mb-6">
                        <p className="font-bold flex items-center gap-2">
                            <Shield className="size-5" />
                            No se encontraron zonas o secciones en este evento.
                        </p>
                        <p className="text-sm mt-1 ml-7">
                            Todos los scanners registrados abajo funcionarán con <strong>Acceso Total</strong> (podrán leer cualquier código de este evento). Si necesitas restringir puertas, debes asegurarte de que el archivo CSV importado tenga la información de la Zona en la 3ra columna.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-[#1a1c20] rounded-2xl border border-gray-100 dark:border-white/5 p-10 text-center">
                            <Smartphone className="size-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold">No hay scanners registrados</h3>
                            <p className="text-gray-500 mb-4">Ve a la sección "Scanners (Zebra)" en el menú principal para registrar un dispositivo.</p>
                            <Button asChild>
                                <Link href={route('admin.access.devices.index')}>Registrar Scanner</Link>
                            </Button>
                        </div>
                    ) : (
                        devices.map(device => (
                            <DeviceCard 
                                key={device.id} 
                                device={device} 
                                sections={sections} 
                                initialAssigned={assignments[device.id] || []}
                                onSave={(selected) => handleSave(device.id, selected)}
                            />
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function DeviceCard({ device, sections, initialAssigned, onSave }: { 
    device: Device, 
    sections: string[], 
    initialAssigned: string[],
    onSave: (selected: string[]) => void 
}) {
    const [selected, setSelected] = useState<string[]>(initialAssigned);
    const [isDirty, setIsDirty] = useState(false);

    const toggleSection = (section: string) => {
        setIsDirty(true);
        if (selected.includes(section)) {
            setSelected(selected.filter(s => s !== section));
        } else {
            setSelected([...selected, section]);
        }
    };

    const toggleAll = () => {
        setIsDirty(true);
        if (selected.length === sections.length) {
            setSelected([]);
        } else {
            setSelected([...sections]);
        }
    };

    const isAll = selected.length === sections.length || selected.length === 0 && !isDirty && initialAssigned.length === 0;

    return (
        <div className="bg-white dark:bg-[#1a1c20] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Smartphone className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{device.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{device.device_identifier}</p>
                    </div>
                </div>
                <div className="mt-4">
                    {selected.length === 0 ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                            <Shield className="size-3 mr-1" /> Acceso Total (Todas las Zonas)
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                            <Shield className="size-3 mr-1" /> {selected.length} Zonas Asignadas
                        </Badge>
                    )}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Zonas Permitidas</p>
                    {sections.length > 0 && (
                        <button 
                            onClick={toggleAll}
                            className="text-xs text-primary font-medium hover:underline"
                        >
                            {selected.length === sections.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                        </button>
                    )}
                </div>

                {sections.length === 0 ? (
                    <div className="text-sm text-gray-500 italic mb-6">
                        No hay zonas para seleccionar.
                    </div>
                ) : (
                    <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {sections.map(section => (
                            <div key={section} className="flex items-start space-x-3">
                                <Checkbox 
                                    id={`dev-${device.id}-sec-${section}`} 
                                    checked={selected.includes(section)}
                                    onCheckedChange={() => toggleSection(section)}
                                    className="mt-0.5"
                                />
                                <label 
                                    htmlFor={`dev-${device.id}-sec-${section}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {section}
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                    <Button 
                        className="w-full" 
                        disabled={!isDirty}
                        onClick={() => {
                            onSave(selected);
                            setIsDirty(false);
                        }}
                    >
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        </div>
    );
}
