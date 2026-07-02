import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  IdCard,
  LayoutDashboard,
  Mail,
  Settings,
  Tags,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  /** Slug do modulo que ativa este item (undefined = sempre visivel). */
  module?: string;
  icon: LucideIcon;
}

/** Navegacao mapeada a modulos. So aparece se o modulo estiver ativo na org. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', module: 'dashboard', icon: LayoutDashboard },
  { label: 'Membros', href: '/members', module: 'members', icon: Users },
  { label: 'Planos', href: '/membership-plans', module: 'membership-plans', icon: Tags },
  { label: 'Pagamentos', href: '/payments', module: 'payments', icon: CreditCard },
  { label: 'Cartões', href: '/cards', module: 'cards', icon: IdCard },
  { label: 'Comunicações', href: '/communications', module: 'communications', icon: Mail },
  { label: 'Relatórios', href: '/reports', module: 'reports', icon: BarChart3 },
  { label: 'Eventos', href: '/events', module: 'events', icon: Calendar },
  { label: 'Documentos', href: '/documents', module: 'documents', icon: FileText },
  { label: 'Football', href: '/football', module: 'football', icon: Trophy },
  { label: 'Modulos', href: '/modules', icon: Settings },
];
