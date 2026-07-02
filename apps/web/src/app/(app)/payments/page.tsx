'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, openBlob } from '@/lib/api';
import type { Member, MembershipPlan, Payment, PaymentMethod, PaymentStatus } from '@/lib/types';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Numerário',
  TRANSFER: 'Transferência',
  CARD: 'Cartão',
  MBWAY: 'MB WAY',
  OTHER: 'Outro',
};

const STATUS_BADGE: Record<PaymentStatus, { label: string; variant: 'success' | 'muted' | 'secondary' | 'default' }> = {
  PAID: { label: 'Pago', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
  CANCELLED: { label: 'Cancelado', variant: 'muted' },
  REFUNDED: { label: 'Reembolsado', variant: 'default' },
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => api.get<Payment[]>('/payments'),
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: ['membership-plans'],
    queryFn: () => api.get<MembershipPlan[]>('/membership-plans'),
  });

  const selectedMember = useMemo(
    () => members?.find((m) => m.id === memberId),
    [members, memberId],
  );

  // Valor sugerido: valor do plano do socio selecionado.
  const suggestedAmount = useMemo(() => {
    if (!selectedMember?.quotaPlan) return '';
    const plan = plans?.find((p) => p.id === selectedMember.quotaPlan?.id);
    return plan ? Number(plan.amount).toFixed(2) : '';
  }, [selectedMember, plans]);

  const createPayment = useMutation({
    mutationFn: () =>
      api.post<Payment>('/payments', {
        memberId,
        method,
        amount: amount ? Number(amount) : undefined,
      }),
    onSuccess: () => {
      setMemberId('');
      setAmount('');
      setMethod('CASH');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Pagamentos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Regista pagamentos de quotas e emite comprovativos em PDF.
      </p>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (memberId) createPayment.mutate();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Sócio</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecionar sócio...</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.number} - {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Valor (€)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder={suggestedAmount || '0.00'}
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium">Método</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={createPayment.isPending || !memberId}>
              {createPayment.isPending ? 'A registar...' : 'Registar pagamento'}
            </Button>
          </form>
          {selectedMember && suggestedAmount && !amount && (
            <p className="mt-2 text-xs text-muted-foreground">
              Valor do plano ({selectedMember.quotaPlan?.name}): {suggestedAmount} € — deixa vazio para usar este valor.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Sócio</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Valor</th>
                <th className="p-3 font-medium">Método</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium text-right">Comprovativo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    A carregar...
                  </td>
                </tr>
              ) : payments && payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">{new Date(p.paidAt ?? p.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td className="p-3 font-medium">{p.member.name}</td>
                    <td className="p-3">{p.quotaPlan?.name ?? '-'}</td>
                    <td className="p-3">{Number(p.amount).toFixed(2)} €</td>
                    <td className="p-3">{METHOD_LABEL[p.method]}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_BADGE[p.status].variant}>{STATUS_BADGE[p.status].label}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => openBlob(`/payments/${p.id}/receipt`)}>
                          <FileText className="h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Sem pagamentos registados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
