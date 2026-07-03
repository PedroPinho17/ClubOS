'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, HelpCircle, ShieldAlert, XCircle } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api, ApiError } from '@/lib/api';
import type { QuotaStatus } from '@/lib/types';

interface ValidationResult {
  organization: { name: string; primaryColor: string };
  member: { name: string; number: string; active: boolean };
  status: QuotaStatus;
  validUntil: string | null;
  checkedAt: string;
}

const STATUS: Record<
  QuotaStatus,
  { label: string; sub: string; color: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  up_to_date: {
    label: 'Sócio em dia',
    sub: 'Quota regularizada',
    color: '#15803d',
    bg: '#dcfce7',
    Icon: CheckCircle2,
  },
  overdue: {
    label: 'Quota em atraso',
    sub: 'Pagamento em falta',
    color: '#b91c1c',
    bg: '#fee2e2',
    Icon: XCircle,
  },
  pending: {
    label: 'Pagamento pendente',
    sub: 'Aguarda regularização',
    color: '#b45309',
    bg: '#fef3c7',
    Icon: Clock,
  },
  no_plan: {
    label: 'Sem plano associado',
    sub: 'Sócio sem quota definida',
    color: '#475569',
    bg: '#f1f5f9',
    Icon: HelpCircle,
  },
};

export default function ValidatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">A carregar...</div>}>
      <ValidateContent />
    </Suspense>
  );
}

function ValidateContent() {
  const params = useParams<{ memberId: string }>();
  const searchParams = useSearchParams();
  const memberId = params.memberId;
  const expires = searchParams.get('expires');
  const sig = searchParams.get('sig');
  const linkValid = Boolean(expires && sig);

  const { data, isLoading, isError, error } = useQuery<ValidationResult>({
    queryKey: ['validate', memberId, expires, sig],
    queryFn: () => {
      const qs = new URLSearchParams({ expires: expires!, sig: sig! });
      return api.get<ValidationResult>(`/validate/${memberId}?${qs}`);
    },
    enabled: linkValid,
    retry: false,
  });

  const invalidLink = !linkValid;
  const expiredOrInvalid = isError && error instanceof ApiError && error.status === 401;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {invalidLink && (
          <div className="p-10 text-center">
            <ShieldAlert className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-800">Link inválido</h1>
            <p className="mt-2 text-sm text-slate-500">
              Este cartão não tem um link de validação assinado. Leia o QR atualizado no cartão físico.
            </p>
          </div>
        )}

        {!invalidLink && isLoading && (
          <div className="p-10 text-center text-slate-500">A validar cartão...</div>
        )}

        {!invalidLink && isError && (
          <div className="p-10 text-center">
            <XCircle className="mx-auto h-14 w-14 text-red-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-800">
              {expiredOrInvalid ? 'Link expirado' : 'Cartão inválido'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {expiredOrInvalid
                ? 'O link de validação expirou. Peça ao sócio um cartão renovado.'
                : 'Não foi possível validar este cartão. Pode estar inativo ou não existir.'}
            </p>
          </div>
        )}

        {data && (
          <>
            <div
              className="px-6 py-4 text-center text-white"
              style={{ backgroundColor: data.organization.primaryColor }}
            >
              <div className="text-lg font-bold">{data.organization.name}</div>
              <div className="text-xs opacity-90">Validação de Sócio</div>
            </div>

            <div className="p-8 text-center">
              {(() => {
                const s = STATUS[data.status];
                const Icon = s.Icon;
                const inactive = !data.member.active;
                return (
                  <>
                    <div
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
                      style={{ backgroundColor: inactive ? '#f1f5f9' : s.bg }}
                    >
                      <Icon className="h-14 w-14" style={{ color: inactive ? '#64748b' : s.color }} />
                    </div>
                    <h1
                      className="mt-5 text-2xl font-extrabold"
                      style={{ color: inactive ? '#64748b' : s.color }}
                    >
                      {inactive ? 'Sócio inativo' : s.label}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{inactive ? 'Conta suspensa' : s.sub}</p>
                  </>
                );
              })()}

              <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
                <Row label="Nome" value={data.member.name} />
                <Row label="Nº de sócio" value={data.member.number} />
                {data.validUntil && (
                  <Row label="Válido até" value={new Date(data.validUntil).toLocaleDateString('pt-PT')} />
                )}
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Verificado em {new Date(data.checkedAt).toLocaleString('pt-PT')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
