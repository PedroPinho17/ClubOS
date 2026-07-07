import type { Member, Payment, QuotaPlan } from '@clubos/database';
import { TEMPLATE_HEADERS } from './member-import-column-map';

type MemberWithRelations = Member & {
  quotaPlan: QuotaPlan | null;
  payments: Payment[];
};

function formatDatePt(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('pt-PT');
}

function formatAmount(value: { toString(): string } | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = typeof value === 'number' ? value : Number.parseFloat(value.toString());
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2).replace('.', ',');
}

/** Uma linha do Excel no formato do modelo de importação. */
export function rowFromMember(
  member: MemberWithRelations,
  payment?: Payment | null,
  includeMemberData = true,
): string[] {
  const row = Array.from({ length: TEMPLATE_HEADERS.length }, () => '');

  if (includeMemberData) {
    row[0] = member.number;
    row[1] = member.name;
    row[2] = member.email ?? '';
    row[3] = member.phone ?? '';
    row[4] = formatDatePt(member.joinedAt);
    row[5] = member.quotaPlan?.name ?? '';
    row[6] = member.cardRole ?? '';
    row[7] = formatDatePt(member.cardValidUntil);
    row[8] = member.status === 'ACTIVE' ? 'Sim' : 'Não';
    row[9] = member.notes ?? '';
  } else {
    row[0] = member.number;
  }

  if (payment) {
    const paidAt = payment.paidAt ?? payment.createdAt;
    row[10] = formatDatePt(paidAt);
    row[11] = formatAmount(payment.amount);
    row[12] = payment.reference ?? '';
    row[13] = '';
  }

  return row;
}

/** Ordena números de sócio numericamente quando possível. */
export function compareMemberNumbers(a: string, b: string): number {
  const na = Number.parseInt(a, 10);
  const nb = Number.parseInt(b, 10);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, 'pt', { numeric: true });
}

export function sortPaymentsChronologically(payments: Payment[]): Payment[] {
  return [...payments].sort((a, b) => {
    const da = (a.paidAt ?? a.createdAt).getTime();
    const db = (b.paidAt ?? b.createdAt).getTime();
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

/** Linhas completas (cabeçalho + dados) para exportação. */
export function buildMemberExportRows(members: MemberWithRelations[]): string[][] {
  const sorted = [...members].sort((a, b) => compareMemberNumbers(a.number, b.number));
  const rows: string[][] = [[...TEMPLATE_HEADERS]];

  for (const member of sorted) {
    const payments = sortPaymentsChronologically(member.payments);

    if (payments.length === 0) {
      rows.push(rowFromMember(member));
      continue;
    }

    payments.forEach((payment, index) => {
      rows.push(rowFromMember(member, payment, index === 0));
    });
  }

  return rows;
}
