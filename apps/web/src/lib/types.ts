import type {
  CardData,
  PaginatedResult,
  QuotaSituation,
  QuotaStatus,
  StaffRole,
} from "@clubos/shared";

export type {
  ActiveContext,
  CardData,
  CardLayout,
  CardSettings,
  CardTemplate,
  CardTemplateInfo,
  Communication,
  CommunicationAudience,
  CommunicationStatus,
  Member,
  MemberImportResult,
  MembershipPlan,
  MyOrganization,
  Organization,
  OrganizationSummary,
  PaginatedResult,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Periodicity,
  QrContent,
  QuotaSituation,
  QuotaStatus,
  WhatsappLink,
} from "@clubos/shared";

export type { StaffRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  permissions: string[];
}

/** Branding mínimo da org exposto ao portal do sócio. */
export interface PortalOrganizationBranding {
  id: string;
  name: string;
  primaryColor: string;
  hasLogo: boolean;
  logoUrl: string | null;
}

export interface PortalOrganizationSummary {
  id: string;
  name: string;
  primaryColor: string;
  hasLogo: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole | string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface PlatformModule {
  slug: string;
  name: string;
  description: string | null;
  category: "CORE" | "BASE" | "PLUGIN";
  isCore: boolean;
  sortOrder: number;
  enabled: boolean;
}

export interface DashboardStats {
  members: number;
  activeMembers: number;
  payments: number;
  revenue: number;
  overdue: number;
  dueSoon: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  revenueMonthChangePct: number | null;
  recentPayments: {
    id: string;
    amount: number;
    paidAt: string;
    memberName: string;
    memberNumber: string;
  }[];
}

export interface ReportsOverview {
  members: { total: number; active: number; inactive: number };
  quotaBreakdown: Record<QuotaStatus, number>;
  revenue: {
    total: number;
    paymentsCount: number;
    monthly: { month: string; total: number }[];
  };
  membersByPlan: { plan: string; count: number }[];
}

export interface PortalMe {
  member: {
    id: string;
    number: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE";
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
  organization: PortalOrganizationSummary;
}
