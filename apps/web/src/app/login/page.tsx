'use client';

import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { postLoginPath } from '@/lib/auth-redirect';
import { authClient, signIn } from '@/lib/auth-client';

async function redirectAfterLogin(router: ReturnType<typeof useRouter>) {
  const session = await authClient.getSession();
  router.push(postLoginPath(session.data?.user?.role));
  router.refresh();
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message ?? 'Credenciais invalidas.');
      return;
    }
    await redirectAfterLogin(router);
    setLoading(false);
  }

  async function onPasskey() {
    setError(null);
    setLoading(true);
    const res = await signIn.passkey();
    if (res?.error) {
      setLoading(false);
      setError(res.error.message ?? 'Falha na autenticacao com passkey.');
      return;
    }
    await redirectAfterLogin(router);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 text-2xl font-bold text-primary">ClubOS</div>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acede ao backoffice ou portal do socio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onPasskey} disabled={loading}>
            <KeyRound className="h-4 w-4" />
            Entrar com passkey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
