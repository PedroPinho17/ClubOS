'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileText, ImagePlus, Layers, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { MemberCard } from '@/components/cards/member-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, uploadFile } from '@/lib/api';
import type { CardData, CardLayout, CardSettings, CardTemplate, Member, QrContent } from '@/lib/types';

async function waitForImages(el: HTMLElement | null): Promise<void> {
  if (!el) return;
  const imgs = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
  // pequena folga para o layout/QR estabilizar
  await new Promise((r) => setTimeout(r, 60));
}

const FIELD_TOGGLES: { key: keyof CardLayout; label: string }[] = [
  { key: 'showNome', label: 'Nome' },
  { key: 'showNumero', label: 'Número' },
  { key: 'showFoto', label: 'Foto' },
  { key: 'showCargo', label: 'Cargo' },
  { key: 'showValidade', label: 'Validade' },
  { key: 'showPlano', label: 'Plano' },
  { key: 'showEmail', label: 'Email' },
  { key: 'showTelefone', label: 'Telefone' },
];

export default function CardsPage() {
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [memberId, setMemberId] = useState('');
  const [layout, setLayout] = useState<CardLayout | null>(null);
  const [captureData, setCaptureData] = useState<CardData | null>(null);
  const [captureSide, setCaptureSide] = useState<'front' | 'back'>('front');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [exporting, setExporting] = useState(false);

  const { data: settings } = useQuery<CardSettings>({
    queryKey: ['card-settings'],
    queryFn: () => api.get<CardSettings>('/cards/settings'),
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  useEffect(() => {
    if (settings && !layout) setLayout(settings.layout);
  }, [settings, layout]);

  useEffect(() => {
    if (members && members.length > 0 && !memberId) setMemberId(members[0].id);
  }, [members, memberId]);

  const { data: cardData } = useQuery<CardData>({
    queryKey: ['card', memberId],
    queryFn: () => api.get<CardData>(`/cards/${memberId}`),
    enabled: !!memberId,
  });

  const save = useMutation({
    mutationFn: () => api.put<CardSettings>('/cards/settings', layout),
    onSuccess: (res) => {
      setLayout(res.layout);
      queryClient.invalidateQueries({ queryKey: ['card-settings'] });
      queryClient.invalidateQueries({ queryKey: ['card'] });
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => uploadFile('/organization/logo', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card'] });
    },
  });

  if (!layout) {
    return <p className="text-sm text-muted-foreground">A carregar...</p>;
  }

  const set = <K extends keyof CardLayout>(key: K, value: CardLayout[K]) =>
    setLayout((prev) => (prev ? { ...prev, [key]: value } : prev));

  const availableTemplates = (settings?.catalog ?? []).filter(
    (t) => t.key !== 'crc_vale' || layout.crcValeEnabled,
  );

  // Pre-visualizacao com o layout local (edicoes por guardar).
  const previewData: CardData | null = cardData ? { ...cardData, layout } : null;
  const isCrcVale = layout.template === 'crc_vale';

  const captureCardImage = async (el: HTMLElement | null) => {
    await waitForImages(el);
    if (!el) throw new Error('Elemento do cartão indisponível.');
    return toPng(el, { pixelRatio: 4, cacheBust: true });
  };

  const exportPng = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
    const suffix = isCrcVale && cardSide === 'back' ? '-verso' : '';
    const link = document.createElement('a');
    link.download = `cartao-${cardData?.numeroFormatado ?? 'socio'}${suffix}.png`;
    link.href = dataUrl;
    link.click();
  };

  const CARD_MM: [number, number] = [85.6, 53.98];

  const exportPdf = async () => {
    if (!previewData) return;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: CARD_MM });

    flushSync(() => {
      setCaptureData(previewData);
      setCaptureSide('front');
    });
    await waitForImages(hiddenRef.current);
    if (!hiddenRef.current) return;
    pdf.addImage(await captureCardImage(hiddenRef.current), 'PNG', 0, 0, CARD_MM[0], CARD_MM[1]);

    if (isCrcVale) {
      flushSync(() => setCaptureSide('back'));
      await waitForImages(hiddenRef.current);
      if (hiddenRef.current) {
        pdf.addPage(CARD_MM, 'landscape');
        pdf.addImage(await captureCardImage(hiddenRef.current), 'PNG', 0, 0, CARD_MM[0], CARD_MM[1]);
      }
    }

    flushSync(() => {
      setCaptureData(null);
      setCaptureSide('front');
    });
    pdf.save(`cartao-${cardData?.numeroFormatado ?? 'socio'}.pdf`);
  };

  // Exportacao em lote: renderiza cada cartao num no oculto e junta num PDF.
  const exportAllPdf = async () => {
    const list = members ?? [];
    if (list.length === 0) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: CARD_MM });
      let pageIndex = 0;

      for (let i = 0; i < list.length; i++) {
        const cd = await api.get<CardData>(`/cards/${list[i].id}`);
        const cardPayload = { ...cd, layout };

        flushSync(() => {
          setCaptureData(cardPayload);
          setCaptureSide('front');
        });
        await waitForImages(hiddenRef.current);
        if (!hiddenRef.current) continue;

        if (pageIndex > 0) pdf.addPage(CARD_MM, 'landscape');
        pdf.addImage(await captureCardImage(hiddenRef.current), 'PNG', 0, 0, CARD_MM[0], CARD_MM[1]);
        pageIndex++;

        if (layout.template === 'crc_vale') {
          flushSync(() => setCaptureSide('back'));
          await waitForImages(hiddenRef.current);
          if (hiddenRef.current) {
            pdf.addPage(CARD_MM, 'landscape');
            pdf.addImage(await captureCardImage(hiddenRef.current), 'PNG', 0, 0, CARD_MM[0], CARD_MM[1]);
            pageIndex++;
          }
        }
      }
      pdf.save('cartoes-socios.pdf');
    } finally {
      setCaptureData(null);
      setCaptureSide('front');
      setExporting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Cartões de Sócio</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolhe o modelo do cartão, personaliza o visual e pré-visualiza por sócio.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pre-visualizacao */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="w-full">
                <label className="text-sm font-medium">Sócio</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.number} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {previewData ? (
                <>
                  {isCrcVale && (
                    <div className="flex w-full gap-2">
                      <Button
                        type="button"
                        variant={cardSide === 'front' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setCardSide('front')}
                      >
                        Frente
                      </Button>
                      <Button
                        type="button"
                        variant={cardSide === 'back' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setCardSide('back')}
                      >
                        Verso
                      </Button>
                    </div>
                  )}
                  <MemberCard ref={cardRef} data={previewData} width={420} side={cardSide} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Seleciona um sócio.</p>
              )}

              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    {uploadPhoto.isPending ? 'A enviar...' : 'Foto'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={!memberId || uploadPhoto.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto.mutate(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    {uploadLogo.isPending ? 'A enviar...' : 'Logótipo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadLogo.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo.mutate(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportPng} disabled={!previewData}>
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportPdf} disabled={!previewData}>
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button size="sm" onClick={exportAllPdf} disabled={exporting || !(members?.length)}>
                    <Layers className="h-4 w-4" />
                    {exporting ? 'A gerar...' : 'Todos (PDF)'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Definicoes */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">Modelo ativo</label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={layout.crcValeEnabled}
                      onChange={(e) => set('crcValeEnabled', e.target.checked)}
                    />
                    Ativar layout CRC Vale
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableTemplates.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => set('template', t.key as CardTemplate)}
                      className={`rounded-md border p-2 text-left text-sm transition-colors ${
                        layout.template === t.key
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-input hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Gradiente (início)" value={layout.gradientFrom} onChange={(v) => set('gradientFrom', v)} />
                <ColorField label="Gradiente (fim)" value={layout.gradientTo} onChange={(v) => set('gradientTo', v)} />
                <ColorField label="Cor de destaque" value={layout.accentColor} onChange={(v) => set('accentColor', v)} />
                <ColorField label="Cor do texto" value={layout.textColor} onChange={(v) => set('textColor', v)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField label="Título (rótulo)" value={layout.cardTitle} onChange={(v) => set('cardTitle', v)} />
                <TextField label="Prefixo do número" value={layout.numeroPrefix} onChange={(v) => set('numeroPrefix', v)} />
                <TextField label="Rodapé" value={layout.footerText} onChange={(v) => set('footerText', v)} />
                <TextField label="Slogan (CRC Vale)" value={layout.slogan} onChange={(v) => set('slogan', v)} />
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo do QR</label>
                <select
                  value={layout.qrContent}
                  onChange={(e) => set('qrContent', e.target.value as QrContent)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="validacao">URL de validação</option>
                  <option value="numero">Número do sócio</option>
                  <option value="dados">Dados (JSON)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Campos visíveis</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FIELD_TOGGLES.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(layout[f.key])}
                        onChange={(e) => set(f.key, e.target.checked as never)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  <Save className="h-4 w-4" />
                  {save.isPending ? 'A guardar...' : 'Guardar definições'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Render oculto para exportacao em lote (fora do ecra). */}
      <div style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }} aria-hidden>
        {captureData && (
          <MemberCard ref={hiddenRef} data={captureData} width={620} side={captureSide} />
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-input"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9" />
    </div>
  );
}
