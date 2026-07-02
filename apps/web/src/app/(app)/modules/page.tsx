'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { PlatformModule } from '@/lib/types';

const CATEGORY_LABEL: Record<PlatformModule['category'], string> = {
  CORE: 'Core',
  BASE: 'Modulos base',
  PLUGIN: 'Plugins (modalidades)',
};

export default function ModulesPage() {
  const queryClient = useQueryClient();

  const { data: modules } = useQuery<PlatformModule[]>({
    queryKey: ['modules'],
    queryFn: () => api.get<PlatformModule[]>('/modules'),
  });

  const toggle = useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      api.put(`/modules/${slug}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });

  const groups: PlatformModule['category'][] = ['CORE', 'BASE', 'PLUGIN'];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Modulos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ativa ou desativa modulos para esta organizacao. Os modulos core estao sempre ativos.
      </p>

      <div className="space-y-6">
        {groups.map((category) => {
          const items = (modules ?? []).filter((m) => m.category === category);
          if (items.length === 0) return null;
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{CATEGORY_LABEL[category]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((m) => (
                  <div
                    key={m.slug}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {m.name}
                        {m.enabled && <Badge variant="success">Ativo</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.slug}</div>
                    </div>
                    {m.isCore ? (
                      <Badge variant="muted">Sempre ativo</Badge>
                    ) : (
                      <Button
                        variant={m.enabled ? 'outline' : 'default'}
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ slug: m.slug, enabled: !m.enabled })}
                      >
                        {m.enabled ? 'Desativar' : 'Ativar'}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
