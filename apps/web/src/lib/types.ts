export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  plan: string;
  status: string;
}

export interface PlatformModule {
  slug: string;
  name: string;
  description: string | null;
  category: 'CORE' | 'BASE' | 'PLUGIN';
  isCore: boolean;
  sortOrder: number;
  enabled: boolean;
}

export type Periodicity = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'ONCE';

export type QuotaStatus = 'up_to_date' | 'overdue' | 'no_plan' | 'pending';

export interface QuotaSituation {
  status: QuotaStatus;
  nextDueDate: string | null;
  lastPaymentAt: string | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  amount: string;
  periodicity: Periodicity;
  active: boolean;
  createdAt: string;
  _count?: { members: number };
}

export interface Member {
  id: string;
  number: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  userId?: string | null;
  photoUrl?: string | null;
  quotaPlan: { id: string; name: string; amount: string } | null;
  quotaSituation?: QuotaSituation;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MBWAY' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  member: { id: string; name: string; number: string };
  quotaPlan: { id: string; name: string } | null;
}

export type CardTemplate = 'classic' | 'modern' | 'minimal' | 'crc_vale';
export type QrContent = 'validacao' | 'numero' | 'dados';

export interface CardLayout {
  template: CardTemplate;
  crcValeEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  textColor: string;
  cardTitle: string;
  cargoLabel: string;
  numeroPrefix: string;
  footerText: string;
  slogan: string;
  qrContent: QrContent;
  showNome: boolean;
  showNumero: boolean;
  showFoto: boolean;
  showValidade: boolean;
  showCargo: boolean;
  showPlano: boolean;
  showEmail: boolean;
  showTelefone: boolean;
  showAdesao: boolean;
}

export interface CardTemplateInfo {
  key: CardTemplate;
  label: string;
  group: 'base' | 'clube';
  description: string;
}

export interface CardSettings {
  layout: CardLayout;
  catalog: CardTemplateInfo[];
}

export interface CardData {
  layout: CardLayout;
  catalog: CardTemplateInfo[];
  organization: { name: string; primaryColor: string; logoUrl: string | null };
  member: {
    id: string;
    name: string;
    number: string;
    email: string | null;
    phone: string | null;
    cardRole: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    joinedAt: string;
    planName: string | null;
    photoUrl: string | null;
  };
  numeroFormatado: string;
  validityText: string | null;
  validadePeriodo: string;
  quotaStatus: QuotaStatus;
  active: boolean;
  qrPayload: string;
}

export interface DashboardStats {
  members: number;
  activeMembers: number;
  payments: number;
  revenue: number;
}

export type CommunicationAudience = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'PLAN';
export type CommunicationStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';

export interface Communication {
  id: string;
  subject: string;
  body: string;
  audience: CommunicationAudience;
  planId: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: CommunicationStatus;
  createdAt: string;
}

export interface ReportsOverview {
  members: { total: number; active: number; inactive: number };
  quotaBreakdown: Record<QuotaStatus, number>;
  revenue: { total: number; paymentsCount: number; monthly: { month: string; total: number }[] };
  membersByPlan: { plan: string; count: number }[];
}

export interface PortalMe {
  member: {
    id: string;
    number: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    joinedAt: string;
    planName: string | null;
  };
  quotaSituation: QuotaSituation;
  payments: {
    id: string;
    amount: string;
    method: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  card: CardData | null;
}
