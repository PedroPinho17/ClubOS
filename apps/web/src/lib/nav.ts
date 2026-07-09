/**
 * @module Nav
 * Itens de navegacao do backoffice, filtrados por modulos activos e role.
 */
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  IdCard,
  LayoutDashboard,
  Mail,
  Settings,
  SlidersHorizontal,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  /** Slug do modulo que ativa este item (undefined = sempre visivel). */
  module?: string;
  icon: LucideIcon;
  /** Roles com acesso (undefined = todos os roles do backoffice). */
  roles?: string[];
}

/** Navegacao mapeada a modulos. So aparece se o modulo estiver ativo na org. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', module: 'dashboard', icon: LayoutDashboard },
  { label: 'Membros', href: '/members', module: 'members', icon: Users },
  { label: 'Planos', href: '/membership-plans', module: 'membership-plans', icon: Tags, roles: ['imperador', 'administrador'] },
  { label: 'Pagamentos', href: '/payments', module: 'payments', icon: CreditCard },
  { label: 'Cartões', href: '/cards', module: 'cards', icon: IdCard, roles: ['imperador', 'administrador'] },
  { label: 'Comunicações', href: '/communications', module: 'communications', icon: Mail, roles: ['imperador', 'administrador'] },
  { label: 'Relatórios', href: '/reports', module: 'reports', icon: BarChart3 },
  { label: 'Auditoria', href: '/audit', icon: ClipboardList, roles: ['imperador', 'administrador'] },
  { label: 'Definições', href: '/settings', icon: SlidersHorizontal, roles: ['imperador', 'administrador'] },
  { label: 'Módulos', href: '/modules', icon: Settings, roles: ['imperador'] },
];

/** Filtra itens de navegacao por modulos ativos e role do utilizador. */
export function filterNavItems(
  items: NavItem[],
  enabledModules: Set<string>,
  role: string | null | undefined,
): NavItem[] {
  return items.filter((item) => {
    if (item.roles && (!role || !item.roles.includes(role))) return false;
    if (item.module && !enabledModules.has(item.module)) return false;
    return true;
  });
}
