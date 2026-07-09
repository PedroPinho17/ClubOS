/**
 * @module ImportRowValidator
 * Funcoes puras de validacao e mapeamento de linhas Excel de importacao de socios.
 * Sem acesso a base de dados — facil de testar unitariamente.
 */
import { MemberStatus, type QuotaPlan } from '@clubos/database';
import { MEMBER_FIELDS } from './member-import-column-map';
import {
  cellWasExplicitlyEmpty,
  formatYearMonth,
  nullableString,
  parseBoolean,
  parseDate,
  parseDecimal,
} from './member-import-parse';
import type { ImportRowData } from './member-import.types';

export interface MemberPayload {
  number?: string;
  name: string;
  email: string | null;
  phone: string | null;
  joinedAt: Date;
  cardRole: string | null;
  notes: string | null;
  status: MemberStatus;
  quotaPlanId?: string | null;
  cardValidUntil?: Date | null;
}

export interface PaymentPayload {
  paidAt: Date;
  amount: number;
  reference: string;
}

export function extractRowData(row: unknown[], columnMap: Record<number, string>): ImportRowData {
  const data: ImportRowData = {};
  for (const [index, field] of Object.entries(columnMap)) {
    data[field] = row[Number(index)] ?? null;
  }
  return data;
}

export function rowIsEmpty(data: ImportRowData): boolean {
  return Object.values(data).every(
    (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === ''),
  );
}

export function fieldHasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

export function isPaymentOnlyRow(data: ImportRowData): boolean {
  const numero = nullableString(data.numero);
  if (!numero) return false;
  if (nullableString(data.nome)) return false;

  for (const field of MEMBER_FIELDS) {
    if (field === 'nome') continue;
    if (fieldHasValue(data[field])) return false;
  }
  return true;
}

export function hasPaymentData(data: ImportRowData): boolean {
  return (
    fieldHasValue(data.pagamento_data) ||
    fieldHasValue(data.pagamento_valor) ||
    fieldHasValue(data.pagamento_referencia) ||
    fieldHasValue(data.pagamento_notas)
  );
}

export function buildMemberPayload(data: ImportRowData, plans: QuotaPlan[]): MemberPayload {
  const joinedAt = parseDate(data.data_adesao);
  if (!joinedAt) {
    throw new Error('A data de adesão é obrigatória (formato dd/mm/aaaa).');
  }

  const email = nullableString(data.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Email inválido: «${email}».`);
  }

  let quotaPlanId: string | null | undefined = undefined;
  const planName = nullableString(data.quota_plan);
  if (planName) {
    const plan = plans.find((p) => p.name.localeCompare(planName, 'pt', { sensitivity: 'accent' }) === 0);
    if (!plan) throw new Error(`Plano de quota «${planName}» não encontrado.`);
    quotaPlanId = plan.id;
  } else if ('quota_plan' in data && cellWasExplicitlyEmpty(data.quota_plan)) {
    quotaPlanId = null;
  }

  let cardValidUntil: Date | null | undefined = undefined;
  const validade = parseDate(data.validade_manual);
  if (validade) {
    cardValidUntil = validade;
  } else if ('validade_manual' in data && cellWasExplicitlyEmpty(data.validade_manual)) {
    cardValidUntil = null;
  }

  return {
    number: nullableString(data.numero) ?? undefined,
    name: String(data.nome).trim(),
    email,
    phone: nullableString(data.telefone),
    joinedAt,
    cardRole: nullableString(data.cargo_cartao),
    notes: nullableString(data.notas),
    status: parseBoolean(data.ativo, true) ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
    quotaPlanId,
    cardValidUntil,
  };
}

export function buildPaymentPayload(data: ImportRowData): PaymentPayload {
  const paidAt = parseDate(data.pagamento_data);
  if (!paidAt) {
    throw new Error('Para registar pagamento, indique a data do pagamento.');
  }
  const amount = parseDecimal(data.pagamento_valor);
  if (amount === null || amount <= 0) {
    throw new Error('Para registar pagamento, indique um valor maior que zero.');
  }
  const reference = nullableString(data.pagamento_referencia) ?? formatYearMonth(paidAt);
  return { paidAt, amount, reference };
}
