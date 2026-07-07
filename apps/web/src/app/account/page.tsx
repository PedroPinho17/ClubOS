'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient, changePassword, useSession } from '@/lib/auth-client';

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [name, setName] = useState('');
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
      const res = await authClient.updateUser({ name: trimmed });
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

      <Button type="button" variant="outline" onClick={() => router.back()}>
        Fechar
      </Button>
    </div>
  );
}
