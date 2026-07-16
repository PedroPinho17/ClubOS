/**
 * Contratos de domínio partilhados API ↔ Web.
 * DTOs de pedido (class-validator) ficam na API; aqui vivem enums e respostas.
 */

export type Periodicity =
  "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "ANNUAL" | "ONCE";

export type QuotaStatus =
  "up_to_date" | "due_soon" | "overdue" | "no_plan" | "pending";

export interface QuotaSituation {
  status: QuotaStatus;
  nextDueDate: string | null;
  lastPaymentAt: string | null;
  daysUntilDue?: number | null;
  daysOverdue?: number | null;
}

export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "MBWAY" | "OTHER";
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export type CommunicationAudience = "ALL" | "ACTIVE" | "OVERDUE" | "PLAN";
export type CommunicationStatus = "QUEUED" | "SENDING" | "SENT" | "FAILED";

export type CardTemplate = "classic" | "modern" | "minimal" | "crc_vale";
export type QrContent = "validacao" | "numero" | "dados";

export interface MemberImportError {
  row: number;
  message: string;
}

export interface MemberImportResult {
  created: number;
  updated: number;
  payments: number;
  skipped: number;
  errors: MemberImportError[];
  /** true quando a importação foi apenas simulada (sem gravar na BD). */
  dryRun?: boolean;
}

export function emptyImportResult(): MemberImportResult {
  return { created: 0, updated: 0, payments: 0, skipped: 0, errors: [] };
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
  status: "ACTIVE" | "INACTIVE";
  userId?: string | null;
  photoUrl?: string | null;
  cardRole?: string | null;
  notes?: string | null;
  joinedAt: string;
  cardValidUntil?: string | null;
  quotaPlan: { id: string; name: string; amount: string } | null;
  quotaSituation?: QuotaSituation;
  createdAt: string;
}

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
  group: "base" | "clube";
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
    status: "ACTIVE" | "INACTIVE";
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

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  primaryColor: string;
}

export interface Organization extends OrganizationSummary {
  logoUrl?: string | null;
  locale?: string | null;
  timezone?: string | null;
}

export interface MyOrganization extends OrganizationSummary {
  logoUrl?: string | null;
  orgRole: string;
}

export interface ActiveContext {
  organizationId: string;
  effectiveRole: string;
}

export interface WhatsappLink {
  name: string;
  phone: string;
  url: string;
}
