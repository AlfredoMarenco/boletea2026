import { route } from 'ziggy-js';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, MapPin, Map, Building, Users, Puzzle, Image as ImageIcon } from 'lucide-react';
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
        href: route('admin.events.index'),
        icon: BookOpen,
    },
    {
        title: 'Puntos de Venta',
        href: route('admin.sales-centers.index'),
        icon: MapPin,
    },
    {
        title: 'Grupos de Ventas',
        href: route('admin.sales-center-groups.index'),
        icon: Users,
    },
    {
        title: 'Estados',
        href: route('admin.states.index'),
        icon: Map,
    },
    {
        title: 'Ciudades',
        href: route('admin.cities.index'),
        icon: Building,
    },
    {
        title: 'Categorias',
        href: route('admin.categories.index'),
        icon: Puzzle,
    },
    {
        title: 'Recintos',
        href: route('admin.venues.index'),
        icon: Building,
    },
    {
        title: 'Usuarios',
        href: route('admin.users.index'),
        icon: Users,
    },
    
];

const footerNavItems: NavItem[] = [
    /* {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    }, */
    {
        title: 'Biblioteca de Medios',
        href: route('admin.images.index'),
        icon: ImageIcon,
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
