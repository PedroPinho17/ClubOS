'use client';

import { getAuthenticatorName } from '@better-auth/passkey';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { changePassword, passkey, updateUser, useListPasskeys, useSession } from '@/lib/auth-client';

type UserPasskey = {
  id: string;
  name?: string | null;
  deviceType?: string | null;
  backedUp?: boolean | null;
  createdAt?: string | Date | null;
  aaguid?: string | null;
};

function passkeyLabel(item: UserPasskey): string {
  const trimmed = item.name?.trim();
  if (trimmed) return trimmed;
  const fromAaguid = item.aaguid ? getAuthenticatorName(item.aaguid) : null;
  if (fromAaguid) return fromAaguid;
  return 'Passkey';
}

function formatPasskeyMeta(item: UserPasskey): string {
  const parts: string[] = [];
  if (item.deviceType === 'platform') parts.push('Este dispositivo');
  else if (item.deviceType === 'cross-platform') parts.push('Chave de segurança');
  if (item.backedUp) parts.push('sincronizada na cloud');
  if (item.createdAt) {
    const date = new Date(item.createdAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(`desde ${date.toLocaleDateString('pt-PT')}`);
    }
  }
  return parts.join(' · ') || 'Autenticação sem password';
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const { data: passkeysData, isPending: passkeysLoading, refetch: refetchPasskeys } = useListPasskeys();
  const passkeys = passkeysData ?? [];
  const [name, setName] = useState('');
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('O nome é obrigatório.');
      const res = await updateUser({ name: trimmed });
      if (res.error) throw new Error(res.error.message ?? 'Não foi possível atualizar o perfil.');
    },
    onSuccess: async () => {
      await refetch();
      alert('Dados atualizados com sucesso.');
    },
    onError: (err: Error) => alert(err.message),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error('A nova password deve ter pelo menos 8 caracteres.');
      if (newPassword !== confirmPassword) throw new Error('As passwords não coincidem.');
      const res = await changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
      if (res.error) throw new Error(res.error.message ?? 'Não foi possível alterar a password.');
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password alterada com sucesso.');
    },
    onError: (err: Error) => alert(err.message),
  });

  const addPasskey = useMutation({
    mutationFn: async () => {
      const label = newPasskeyName.trim();
      const res = await passkey.addPasskey({ name: label || undefined });
      if (res.error) throw new Error(res.error.message ?? 'Não foi possível adicionar a passkey.');
    },
    onSuccess: async () => {
      setNewPasskeyName('');
      await refetchPasskeys();
      alert('Passkey adicionada com sucesso.');
    },
    onError: (err: Error) => alert(err.message),
  });

  const removePasskey = useMutation({
    mutationFn: async (id: string) => {
      const res = await passkey.deletePasskey({ id });
      if (res.error) throw new Error(res.error.message ?? 'Não foi possível eliminar a passkey.');
    },
    onSuccess: async () => {
      await refetchPasskeys();
      alert('Passkey eliminada.');
    },
    onError: (err: Error) => alert(err.message),
  });

  if (isPending || !session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">A minha conta</h1>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do utilizador</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile.mutate();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="account-name">
                Nome
              </label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <Button type="submit" disabled={saveProfile.isPending || !name.trim()}>
              {saveProfile.isPending ? 'A guardar...' : 'Guardar nome'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePassword.mutate();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">Password atual</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nova password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirmar nova password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={savePassword.isPending || !currentPassword || !newPassword}>
              {savePassword.isPending ? 'A guardar...' : 'Guardar nova password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passkeys</CardTitle>
          <CardDescription>
            Entra sem password com impressão digital, Face ID ou chave de segurança. Podes ter várias passkeys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passkeysLoading ? (
            <p className="text-sm text-muted-foreground">A carregar passkeys...</p>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não tens passkeys registadas.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {passkeys.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{passkeyLabel(item)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatPasskeyMeta(item)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={removePasskey.isPending}
                    onClick={() => {
                      if (!window.confirm(`Eliminar a passkey "${passkeyLabel(item)}"?`)) return;
                      removePasskey.mutate(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="flex flex-wrap items-end gap-3 border-t pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              addPasskey.mutate();
            }}
          >
            <div className="min-w-[200px] flex-1 space-y-1">
              <label className="text-sm font-medium" htmlFor="new-passkey-name">
                Nome da nova passkey (opcional)
              </label>
              <Input
                id="new-passkey-name"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder="Ex.: MacBook, iPhone, YubiKey"
                maxLength={80}
              />
            </div>
            <Button type="submit" disabled={addPasskey.isPending}>
              <Plus className="h-4 w-4" />
              {addPasskey.isPending ? 'A registar...' : 'Adicionar passkey'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button type="button" variant="outline" onClick={() => router.back()}>
        Fechar
      </Button>
    </div>
  );
}
