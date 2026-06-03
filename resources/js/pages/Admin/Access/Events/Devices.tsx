import AppLayout from '@/layouts/app-layout';
import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Smartphone, Shield, GripVertical, Plus, Trash2, Edit2, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Device {
    id: number;
    name: string;
    device_identifier: string;
    access_device_group_id: number | null;
    allowed_sections: string[];
}

interface Group {
    id: number;
    name: string;
    description: string | null;
    allowed_sections: string[];
}

interface Props {
    event: {
        id: number;
        name: string;
    };
    sections: string[];
    devices: Device[];
    groups: Group[];
}

export default function Devices({ event, sections, devices, groups }: Props) {
    const [ready, setReady] = useState(false);
    const [localDevices, setLocalDevices] = useState<Device[]>(devices);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);

    // Sync local state when props change
    useEffect(() => {
        setLocalDevices(devices);
    }, [devices]);

    useEffect(() => {
        setReady(true);
    }, []);

    // Create Group Form
    const createForm = useForm({
        name: '',
        description: '',
    });

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.access.events.groups.store', event.id), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    // Edit Group Form
    const editGroupForm = useForm({
        name: '',
        description: '',
        allowed_sections: [] as string[],
    });

    useEffect(() => {
        if (editingGroup) {
            editGroupForm.setData({
                name: editingGroup.name,
                description: editingGroup.description || '',
                allowed_sections: editingGroup.allowed_sections || [],
            });
        }
    }, [editingGroup]);

    const handleUpdateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup) return;

        editGroupForm.put(
            route('admin.access.events.groups.update', { event: event.id, group: editingGroup.id }),
            {
                onSuccess: () => {
                    setEditingGroup(null);
                },
            }
        );
    };

    const handleDeleteGroup = (groupId: number) => {
        if (
            confirm(
                '¿Estás seguro de que deseas eliminar este grupo? Los scanners asignados pasarán a estar sin grupo pero conservarán su última configuración.'
            )
        ) {
            router.delete(route('admin.access.events.groups.destroy', { event: event.id, group: groupId }), {
                preserveScroll: true,
            });
        }
    };

    // Device Edit Form
    const editDeviceForm = useForm({
        device_id: 0,
        sections: [] as string[],
    });

    useEffect(() => {
        if (editingDevice) {
            editDeviceForm.setData({
                device_id: editingDevice.id,
                sections: editingDevice.allowed_sections || [],
            });
        }
    }, [editingDevice]);

    const handleUpdateDevice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;

        editDeviceForm.post(route('admin.access.events.devices.assign', event.id), {
            onSuccess: () => {
                setEditingDevice(null);
            },
        });
    };

    // Drag and drop end handler
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const deviceId = parseInt(draggableId, 10);
        const destGroupId =
            destination.droppableId === 'ungrouped'
                ? null
                : parseInt(destination.droppableId.replace('group-', ''), 10);

        // Optimistic UI update
        const updatedDevices = localDevices.map((d) => {
            if (d.id === deviceId) {
                const destGroup = destGroupId ? groups.find((g) => g.id === destGroupId) : null;
                return {
                    ...d,
                    access_device_group_id: destGroupId,
                    allowed_sections: destGroup ? destGroup.allowed_sections : [],
                };
            }
            return d;
        });
        setLocalDevices(updatedDevices);

        // Post request to backend
        router.post(
            route('admin.access.events.devices.move', event.id),
            {
                device_id: deviceId,
                group_id: destGroupId,
            },
            {
                preserveScroll: true,
                onError: () => {
                    // Revert on error
                    setLocalDevices(devices);
                },
            }
        );
    };

    // Group toggle helper for checkboxes
    const toggleGroupSection = (section: string) => {
        const current = [...editGroupForm.data.allowed_sections];
        if (current.includes(section)) {
            editGroupForm.setData(
                'allowed_sections',
                current.filter((s) => s !== section)
            );
        } else {
            editGroupForm.setData('allowed_sections', [...current, section]);
        }
    };

    const toggleAllGroupSections = () => {
        if (editGroupForm.data.allowed_sections.length === sections.length) {
            editGroupForm.setData('allowed_sections', []);
        } else {
            editGroupForm.setData('allowed_sections', [...sections]);
        }
    };

    // Device toggle helper for checkboxes
    const toggleDeviceSection = (section: string) => {
        const current = [...editDeviceForm.data.sections];
        if (current.includes(section)) {
            editDeviceForm.setData(
                'sections',
                current.filter((s) => s !== section)
            );
        } else {
            editDeviceForm.setData('sections', [...current, section]);
        }
    };

    const toggleAllDeviceSections = () => {
        if (editDeviceForm.data.sections.length === sections.length) {
            editDeviceForm.setData('sections', []);
        } else {
            editDeviceForm.setData('sections', [...sections]);
        }
    };

    // Filter devices for columns
    const ungroupedDevices = localDevices.filter((d) => d.access_device_group_id === null);

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Control de Acceso',
                    href: route('admin.access.events.index'),
                },
                {
                    title: event.name,
                    href: route('admin.access.events.stats', event.id),
                },
                { title: 'Puertas y Dispositivos', href: '#' },
            ]}
        >
            <Head title={`Puertas - ${event.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-6 pb-20">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('admin.access.events.stats', event.id)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                Configuración de Puertas
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Asigna a cada scanner qué secciones tiene permitido escanear. Organiza tus dispositivos en
                            grupos usando drag & drop.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
                        >
                            <Plus className="size-4" /> Crear Grupo
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.codes', event.id)}>Ver Códigos</Link>
                        </Button>
                    </div>
                </div>

                {sections.length === 0 && (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-4 text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/10 dark:text-yellow-400 flex gap-3">
                        <Shield className="size-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">No se encontraron zonas o secciones en este evento.</p>
                            <p className="mt-0.5 text-xs">
                                Todos los scanners funcionarán con <strong>Acceso Total</strong>. Si necesitas
                                restringir puertas, asegúrate de importar códigos con información de Zona en la columna
                                correspondiente.
                            </p>
                        </div>
                    </div>
                )}

                {/* Board Container */}
                {!ready ? (
                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-80 shrink-0 h-[450px] rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-[#1a1c20]/50 p-4 animate-pulse flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                                <div className="space-y-3 flex-1 justify-center flex flex-col">
                                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-8 items-start select-none">
                            {/* Column: Sin Asignar */}
                            <div className="w-full md:w-80 shrink-0 flex flex-col max-h-[700px] rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-[#1a1c20]/50 p-4">
                                <div className="mb-4 pb-2 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            Sin Asignar
                                            <Badge
                                                variant="secondary"
                                                className="bg-gray-200/60 text-gray-700 dark:bg-white/10 dark:text-gray-300 border-none px-1.5 py-0 text-[10px]"
                                            >
                                                {ungroupedDevices.length}
                                            </Badge>
                                        </h3>
                                        <p className="text-[10px] text-gray-400">Configuración individual por scanner</p>
                                    </div>
                                </div>

                                <Droppable droppableId="ungrouped">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto pr-1 min-h-[300px] rounded-xl transition-colors duration-200 ${
                                                snapshot.isDraggingOver
                                                    ? 'bg-purple-50/30 dark:bg-purple-950/10 border-2 border-dashed border-purple-300/30'
                                                    : ''
                                            }`}
                                        >
                                            {ungroupedDevices.length === 0 ? (
                                                <div className="flex h-full min-h-[150px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/5 p-4 text-center text-xs text-gray-400 italic">
                                                    Arrastra scanners aquí para configurarlos de forma individual
                                                </div>
                                            ) : (
                                                ungroupedDevices.map((device, index) => (
                                                    <DraggableCard
                                                        key={device.id}
                                                        device={device}
                                                        index={index}
                                                        onEditDevice={() => setEditingDevice(device)}
                                                    />
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Columns: Groups */}
                            {groups.map((group) => {
                                const groupDevices = localDevices.filter(
                                    (d) => d.access_device_group_id === group.id
                                );
                                return (
                                    <div
                                        key={group.id}
                                        className="w-full md:w-80 shrink-0 flex flex-col max-h-[700px] rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-[#1a1c20]/50 p-4"
                                    >
                                        <div className="mb-3 pb-2 border-b border-gray-200/50 dark:border-white/5 flex items-start justify-between">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                                    {group.name}
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-none px-1.5 py-0 text-[10px]"
                                                    >
                                                        {groupDevices.length}
                                                    </Badge>
                                                </h3>
                                                <p className="text-[10px] text-gray-400 truncate">
                                                    {group.description || 'Sin descripción'}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-1">
                                                    {group.allowed_sections.length === 0 ? (
                                                        <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                                                            Acceso Total
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                                                            {group.allowed_sections.length} zonas permitidas
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                                    onClick={() => setEditingGroup(group)}
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-gray-400 hover:text-red-600"
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Droppable droppableId={`group-${group.id}`}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 overflow-y-auto pr-1 min-h-[300px] rounded-xl transition-colors duration-200 ${
                                                        snapshot.isDraggingOver
                                                            ? 'bg-purple-50/30 dark:bg-purple-950/10 border-2 border-dashed border-purple-300/30'
                                                            : ''
                                                    }`}
                                                >
                                                    {groupDevices.length === 0 ? (
                                                        <div className="flex h-full min-h-[150px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/5 p-4 text-center text-xs text-gray-400 italic">
                                                            Arrastra scanners aquí para unirlos a este grupo
                                                        </div>
                                                    ) : (
                                                        groupDevices.map((device, index) => (
                                                            <DraggableCard
                                                                key={device.id}
                                                                device={device}
                                                                index={index}
                                                            />
                                                        ))
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                )}
            </div>

            {/* Dialog: Create Group */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Grupo de Dispositivos</DialogTitle>
                        <DialogDescription>
                            Define un grupo específico para este evento. Todos los scanners colocados en este grupo
                            compartirán la misma configuración.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nombre del Grupo</Label>
                            <Input
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Ej: Palcos VIP, Puerta Principal"
                                required
                            />
                            {createForm.errors.name && (
                                <p className="text-xs text-red-500">{createForm.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Textarea
                                id="description"
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                placeholder="Ej: Restringir acceso sólo a zonas A y B"
                            />
                            {createForm.errors.description && (
                                <p className="text-xs text-red-500">{createForm.errors.description}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={createForm.processing}
                            >
                                {createForm.processing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Grupo'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Edit Group (Allowed sections & Details) */}
            <Dialog open={editingGroup !== null} onOpenChange={(open) => !open && setEditingGroup(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Grupo: {editingGroup?.name}</DialogTitle>
                        <DialogDescription>
                            Modifica los detalles del grupo y restringe las zonas autorizadas para sus scanners.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateGroup} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Nombre del Grupo</Label>
                            <Input
                                id="edit-name"
                                value={editGroupForm.data.name}
                                onChange={(e) => editGroupForm.setData('name', e.target.value)}
                                required
                            />
                            {editGroupForm.errors.name && (
                                <p className="text-xs text-red-500">{editGroupForm.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-description">Descripción</Label>
                            <Textarea
                                id="edit-description"
                                value={editGroupForm.data.description}
                                onChange={(e) => editGroupForm.setData('description', e.target.value)}
                            />
                            {editGroupForm.errors.description && (
                                <p className="text-xs text-red-500">{editGroupForm.errors.description}</p>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3 dark:border-white/5">
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="font-bold text-gray-800 dark:text-gray-200">Zonas Autorizadas</Label>
                                {sections.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={toggleAllGroupSections}
                                        className="text-xs font-semibold text-purple-600 hover:underline"
                                    >
                                        {editGroupForm.data.allowed_sections.length === sections.length
                                            ? 'Deseleccionar Todas'
                                            : 'Seleccionar Todas'}
                                    </button>
                                )}
                            </div>

                            {sections.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No hay zonas cargadas en este evento.</p>
                            ) : (
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {sections.map((section) => (
                                        <div key={section} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`grp-sec-${section}`}
                                                checked={editGroupForm.data.allowed_sections.includes(section)}
                                                onCheckedChange={() => toggleGroupSection(section)}
                                            />
                                            <label
                                                htmlFor={`grp-sec-${section}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {section}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="mt-2 text-[10px] text-gray-400">
                                * Si no seleccionas ninguna zona, el grupo tendrá <strong>Acceso Total</strong> (lee
                                cualquier código).
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={editGroupForm.processing}
                            >
                                {editGroupForm.processing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Cambios'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Edit Individual Device Zones */}
            <Dialog open={editingDevice !== null} onOpenChange={(open) => !open && setEditingDevice(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Configurar Puertas: {editingDevice?.name}</DialogTitle>
                        <DialogDescription>
                            Asigna de manera exclusiva las zonas autorizadas para este scanner individual.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateDevice} className="space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="font-bold text-gray-800 dark:text-gray-200">Zonas Autorizadas</Label>
                                {sections.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={toggleAllDeviceSections}
                                        className="text-xs font-semibold text-purple-600 hover:underline"
                                    >
                                        {editDeviceForm.data.sections.length === sections.length
                                            ? 'Deseleccionar Todas'
                                            : 'Seleccionar Todas'}
                                    </button>
                                )}
                            </div>

                            {sections.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No hay zonas cargadas en este evento.</p>
                            ) : (
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {sections.map((section) => (
                                        <div key={section} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`dev-sec-${section}`}
                                                checked={editDeviceForm.data.sections.includes(section)}
                                                onCheckedChange={() => toggleDeviceSection(section)}
                                            />
                                            <label
                                                htmlFor={`dev-sec-${section}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {section}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="mt-2 text-[10px] text-gray-400">
                                * Si no seleccionas ninguna zona, el dispositivo tendrá <strong>Acceso Total</strong>{' '}
                                (permitirá leer cualquier código).
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingDevice(null)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={editDeviceForm.processing}
                            >
                                {editDeviceForm.processing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Puertas'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

interface DraggableCardProps {
    device: Device;
    index: number;
    onEditDevice?: () => void;
}

function DraggableCard({ device, index, onEditDevice }: DraggableCardProps) {
    return (
        <Draggable draggableId={String(device.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`mb-3 p-3 rounded-xl border bg-white dark:bg-[#1a1c20] flex items-center gap-3 transition-shadow duration-200 select-none ${
                        snapshot.isDragging
                            ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10 dark:bg-purple-950/20 shadow-md'
                            : 'border-gray-200/60 dark:border-white/5 shadow-xs hover:shadow-xs'
                    }`}
                >
                    <div
                        {...provided.dragHandleProps}
                        className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 shrink-0"
                    >
                        <GripVertical className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate" title={device.name}>
                            {device.name}
                        </h4>
                        <p className="font-mono text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                            {device.device_identifier}
                        </p>

                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {device.access_device_group_id ? (
                                <Badge
                                    variant="secondary"
                                    className="text-[9px] py-0 px-1 border-none bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 font-semibold"
                                >
                                    Hereda Grupo
                                </Badge>
                            ) : device.allowed_sections.length === 0 ? (
                                <Badge
                                    variant="secondary"
                                    className="text-[9px] py-0 px-1 border-none bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
                                >
                                    Acceso Total
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="text-[9px] py-0 px-1 border-none bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 font-semibold"
                                >
                                    {device.allowed_sections.length} Zonas
                                </Badge>
                            )}
                        </div>
                    </div>

                    {onEditDevice && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-gray-400 hover:text-gray-700 dark:hover:text-white shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditDevice();
                            }}
                        >
                            <Edit2 className="size-3" />
                        </Button>
                    )}
                </div>
            )}
        </Draggable>
    );
}
