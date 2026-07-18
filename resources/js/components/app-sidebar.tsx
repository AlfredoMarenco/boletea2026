import { route } from 'ziggy-js';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, MapPin, Map, Building, Users, Puzzle, Image as ImageIcon, Settings, Mail, Tablet, Undo } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('admin.dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Eventos',
        icon: BookOpen,
        items: [
            { title: 'Externos (Cartelera)', href: route('admin.events.index') },
            { title: 'Locales (Venta)', href: route('admin.local-events.index') },
            { title: 'Categorías', href: route('admin.categories.index') },
        ]
    },
    {
        title: 'Infraestructura',
        icon: Building,
        items: [
            { title: 'Recintos', href: route('admin.venues.index') },
            { title: 'Mapas de Asientos', href: route('admin.seating-maps.index') },
            { title: 'Estados', href: route('admin.states.index') },
            { title: 'Ciudades', href: route('admin.cities.index') },
        ]
    },
    {
        title: 'Puntos de Venta',
        icon: MapPin,
        items: [
            { title: 'Lista de Puntos', href: route('admin.sales-centers.index') },
            { title: 'Grupos de Venta', href: route('admin.sales-center-groups.index') },
        ]
    },
    {
        title: 'Control de Acceso',
        icon: Folder,
        items: [
            { title: 'Bases de Acceso', href: route('admin.access.events.index') },
            { title: 'Scanners (Zebra)', href: route('admin.access.devices.index') },
        ]
    },
    {
        title: 'Mailing & Marketing',
        icon: Mail,
        items: [
            { title: 'Campañas', href: '/admin/mailing/campaigns' },
            { title: 'Contactos', href: '/admin/mailing/contacts' },
            { title: 'Audiencias', href: '/admin/mailing/audiences' },
        ]
    },
    {
        title: 'Reembolsos',
        icon: Undo,
        items: [
            { title: 'Eventos Habilitados', href: route('admin.refunds.events') },
            { title: 'Solicitudes Recibidas', href: route('admin.refunds.requests') },
        ]
    },
];


const footerNavItems: NavItem[] = [
    {
        title: 'Sistema',
        icon: Settings,
        items: [
            { title: 'Usuarios', href: route('admin.users.index'), icon: Users },
            { title: 'Biblioteca de Medios', href: route('admin.images.index'), icon: ImageIcon },
            { title: 'Configuración', href: route('admin.settings.index'), icon: Settings },
        ]
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('admin.dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
