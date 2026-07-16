"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import type { QuotaStatus } from "@/lib/types";

interface ValidationResult {
  organization: { name: string; primaryColor: string };
  member: { name: string; number: string; active: boolean };
  status: QuotaStatus;
  validUntil: string | null;
  checkedAt: string;
}

const STATUS: Record<
  QuotaStatus,
  {
    label: string;
    sub: string;
    color: string;
    bg: string;
    Icon: typeof CheckCircle2;
  }
> = {
  up_to_date: {
    label: "Sócio em dia",
    sub: "Quota regularizada",
    color: "#15803d",
    bg: "#dcfce7",
    Icon: CheckCircle2,
  },
  due_soon: {
    label: "Quota a vencer",
    sub: "Vencimento em breve",
    color: "#b45309",
    bg: "#fef3c7",
    Icon: Clock,
  },
  overdue: {
    label: "Quota em atraso",
    sub: "Pagamento em falta",
    color: "#b91c1c",
    bg: "#fee2e2",
    Icon: XCircle,
  },
  pending: {
    label: "Pagamento pendente",
    sub: "Aguarda regularização",
    color: "#b45309",
    bg: "#fef3c7",
    Icon: Clock,
  },
  no_plan: {
    label: "Sem plano associado",
    sub: "Sócio sem quota definida",
    color: "#475569",
    bg: "#f1f5f9",
    Icon: HelpCircle,
  },
};

export default function ValidatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-zinc-950">
          <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <ValidateContent />
    </Suspense>
  );
}

function ValidateContent() {
  const params = useParams<{ memberId: string }>();
  const searchParams = useSearchParams();
  const memberId = params.memberId;
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");
  const linkValid = Boolean(expires && sig);

  const { data, isLoading, isError, error } = useQuery<ValidationResult>({
    queryKey: ["validate", memberId, expires, sig],
    queryFn: () => {
      const qs = new URLSearchParams({ expires: expires!, sig: sig! });
      return api.get<ValidationResult>(`/validate/${memberId}?${qs}`);
    },
    enabled: linkValid,
    retry: false,
  });

  const invalidLink = !linkValid;
  const expiredOrInvalid =
    isError && error instanceof ApiError && error.status === 401;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-zinc-800">
        {invalidLink && (
          <div className="p-10 text-center">
            <ShieldAlert className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
              Link inválido
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Este cartão não tem um link de validação assinado. Leia o QR
              atualizado no cartão físico.
            </p>
          </div>
        )}

        {!invalidLink && isLoading && (
          <div className="space-y-4 p-10 text-center">
            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
            <Skeleton className="mx-auto h-6 w-40" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        )}

        {!invalidLink && isError && (
          <div className="p-10 text-center">
            <XCircle className="mx-auto h-14 w-14 text-red-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
              {expiredOrInvalid ? "Link expirado" : "Cartão inválido"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {expiredOrInvalid
                ? "O link de validação expirou. Peça ao sócio um cartão renovado."
                : "Não foi possível validar este cartão. Pode estar inativo ou não existir."}
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
                      style={{
                        backgroundColor: inactive ? "#f1f5f9" : s.bg,
                      }}
                    >
                      <Icon
                        className="h-14 w-14"
                        style={{ color: inactive ? "#64748b" : s.color }}
                      />
                    </div>
                    <h1
                      className="mt-5 text-2xl font-extrabold"
                      style={{ color: inactive ? "#64748b" : s.color }}
                    >
                      {inactive ? "Sócio inativo" : s.label}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {inactive ? "Conta suspensa" : s.sub}
                    </p>
                  </>
                );
              })()}

              <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-zinc-800/80">
                <Row label="Nome" value={data.member.name} />
                <Row label="Nº de sócio" value={data.member.number} />
                {data.validUntil && (
                  <Row
                    label="Válido até"
                    value={new Date(data.validUntil).toLocaleDateString(
                      "pt-PT",
                    )}
                  />
                )}
              </div>

              <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
                Verificado em {new Date(data.checkedAt).toLocaleString("pt-PT")}
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
    <div className="flex justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
