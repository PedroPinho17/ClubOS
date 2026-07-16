"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, ImagePlus, Layers, Printer } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardsSettingsForm } from "@/components/cards/cards-settings-form";
import { api, uploadFile } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  CARD_MM,
  captureCardElement,
  waitForCardImages,
} from "@/lib/card-export";
import { cn } from "@/lib/utils";
import { RoleGate } from "@/components/role-gate";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { isImperador } from "@/lib/permissions";
import { useMembersPicker } from "@/hooks/use-members-picker";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type { CardData, CardLayout, CardSettings } from "@/lib/types";

const CARD_PREVIEW_WIDTH = 420;
const CARD_PREVIEW_HEIGHT = CARD_PREVIEW_WIDTH * (540 / 856);

const MemberCard = dynamic(
  () => import("@/components/cards/member-card").then((mod) => mod.MemberCard),
  {
    loading: () => (
      <Skeleton
        className="rounded-[24px] shadow-lg"
        style={{ width: CARD_PREVIEW_WIDTH, height: CARD_PREVIEW_HEIGHT }}
      />
    ),
    ssr: false,
  },
);

async function captureCardImage(el: HTMLElement | null) {
  if (!el) throw new Error("Elemento do cartão indisponível.");
  return captureCardElement(el);
}

export default function CardsPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">A carregar cartões...</p>
        }
      >
        <CardsPageContent />
      </Suspense>
    </RoleGate>
  );
}

function CardsPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { effectiveRole } = useEffectiveRole();
  const isImperadorRole = isImperador(effectiveRole);
  const cardRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [memberId, setMemberId] = useState("");
  const [layoutDraft, setLayoutDraft] = useState<CardLayout | null>(null);
  const [captureData, setCaptureData] = useState<CardData | null>(null);
  const [captureSide, setCaptureSide] = useState<"front" | "back">("front");
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [exporting, setExporting] = useState(false);

  const cardSettingsKey = useTenantQueryKey(["card-settings"]);
  const cardKey = useTenantQueryKey(["card", memberId]);

  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery<CardSettings>({
    queryKey: cardSettingsKey,
    queryFn: () => api.get<CardSettings>("/cards/settings"),
    staleTime: 5 * 60_000,
  });

  const {
    members,
    activate: activateMembersPicker,
    hasMore: membersHasMore,
    isLoading: membersLoading,
  } = useMembersPicker();

  useEffect(() => {
    activateMembersPicker();
  }, [activateMembersPicker]);

  useEffect(() => {
    const fromUrl =
      searchParams.get("memberId") ?? searchParams.get("member") ?? "";
    if (fromUrl) setMemberId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (settings?.layout) setLayoutDraft(settings.layout);
  }, [settings?.layout]);

  useEffect(() => {
    if (members.length > 0 && !memberId) setMemberId(members[0].id);
  }, [members, memberId]);

  const layout = layoutDraft;

  const { data: cardData, isLoading: cardLoading } = useQuery<CardData>({
    queryKey: cardKey,
    queryFn: () => api.get<CardData>(`/cards/${memberId}`),
    enabled: !!memberId,
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: () => api.put<CardSettings>("/cards/settings", layoutDraft),
    onSuccess: (res) => {
      setLayoutDraft(res.layout);
      queryClient.invalidateQueries({ queryKey: ["card-settings"] });
      queryClient.invalidateQueries({ queryKey: ["card"] });
      toast.success("Layout guardado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Foto atualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => uploadFile("/organization/logo", file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card"] });
      toast.success("Logótipo atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const set = <K extends keyof CardLayout>(key: K, value: CardLayout[K]) =>
    setLayoutDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const previewData: CardData | null =
    cardData && layout ? { ...cardData, layout } : null;
  const isCrcVale = layout?.template === "crc_vale";

  const exportPng = async () => {
    if (!cardRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
    });
    const suffix = isCrcVale && cardSide === "back" ? "-verso" : "";
    const link = document.createElement("a");
    link.download = `cartao-${cardData?.numeroFormatado ?? "socio"}${suffix}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportPdf = async () => {
    if (!previewData) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: CARD_MM,
    });

    flushSync(() => {
      setCaptureData(previewData);
      setCaptureSide("front");
    });
    await waitForCardImages(hiddenRef.current);
    if (!hiddenRef.current) return;
    pdf.addImage(
      await captureCardImage(hiddenRef.current),
      "PNG",
      0,
      0,
      CARD_MM[0],
      CARD_MM[1],
    );

    if (isCrcVale) {
      flushSync(() => setCaptureSide("back"));
      await waitForCardImages(hiddenRef.current);
      if (hiddenRef.current) {
        pdf.addPage(CARD_MM, "landscape");
        pdf.addImage(
          await captureCardImage(hiddenRef.current),
          "PNG",
          0,
          0,
          CARD_MM[0],
          CARD_MM[1],
        );
      }
    }

    flushSync(() => {
      setCaptureData(null);
      setCaptureSide("front");
    });
    pdf.save(`cartao-${cardData?.numeroFormatado ?? "socio"}.pdf`);
  };

  // Exportacao em lote: renderiza cada cartao num no oculto e junta num PDF.
  const exportAllPdf = async () => {
    const list = members;
    if (list.length === 0 || !layout) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const exportLayout = layout;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: CARD_MM,
      });
      let pageIndex = 0;

      for (let i = 0; i < list.length; i++) {
        const cd = await api.get<CardData>(`/cards/${list[i].id}`);
        const cardPayload = { ...cd, layout: exportLayout };

        flushSync(() => {
          setCaptureData(cardPayload);
          setCaptureSide("front");
        });
        await waitForCardImages(hiddenRef.current);
        if (!hiddenRef.current) continue;

        if (pageIndex > 0) pdf.addPage(CARD_MM, "landscape");
        pdf.addImage(
          await captureCardImage(hiddenRef.current),
          "PNG",
          0,
          0,
          CARD_MM[0],
          CARD_MM[1],
        );
        pageIndex++;

        if (exportLayout.template === "crc_vale") {
          flushSync(() => setCaptureSide("back"));
          await waitForCardImages(hiddenRef.current);
          if (hiddenRef.current) {
            pdf.addPage(CARD_MM, "landscape");
            pdf.addImage(
              await captureCardImage(hiddenRef.current),
              "PNG",
              0,
              0,
              CARD_MM[0],
              CARD_MM[1],
            );
            pageIndex++;
          }
        }
      }
      pdf.save("cartoes-socios.pdf");
    } finally {
      setCaptureData(null);
      setCaptureSide("front");
      setExporting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Cartões de Sócio</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolhe o modelo do cartão, personaliza o visual e pré-visualiza por
        sócio. Para imprimir, usa <strong>Imprimir</strong> (abre página de
        impressão) ou exporta PNG/PDF.
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
                  onFocus={activateMembersPicker}
                  disabled={membersLoading && members.length === 0}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {membersLoading && members.length === 0 ? (
                    <option value="">A carregar sócios...</option>
                  ) : (
                    members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.number} - {m.name}
                      </option>
                    ))
                  )}
                </select>
                {membersHasMore ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pesquise em Membros para encontrar mais sócios (50
                    mostrados).
                  </p>
                ) : null}
              </div>

              {cardLoading || !previewData ? (
                <Skeleton
                  className="rounded-[24px] shadow-lg"
                  style={{
                    width: CARD_PREVIEW_WIDTH,
                    height: CARD_PREVIEW_HEIGHT,
                  }}
                />
              ) : (
                <>
                  {isCrcVale && (
                    <div className="flex w-full gap-2">
                      <Button
                        type="button"
                        variant={cardSide === "front" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setCardSide("front")}
                      >
                        Frente
                      </Button>
                      <Button
                        type="button"
                        variant={cardSide === "back" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setCardSide("back")}
                      >
                        Verso
                      </Button>
                    </div>
                  )}
                  <MemberCard
                    ref={cardRef}
                    data={previewData}
                    width={CARD_PREVIEW_WIDTH}
                    side={cardSide}
                  />
                </>
              )}

              {previewData && (
                <p className="text-xs text-muted-foreground">
                  A pré-visualização reflecte alterações antes de guardar.
                </p>
              )}

              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    {uploadPhoto.isPending ? "A enviar..." : "Foto"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={!memberId || uploadPhoto.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto.mutate(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    {uploadLogo.isPending ? "A enviar..." : "Logótipo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadLogo.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo.mutate(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  {memberId ? (
                    <Link
                      href={`/cartao/${memberId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPng}
                    disabled={!previewData}
                  >
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPdf}
                    disabled={!previewData}
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportAllPdf}
                    disabled={exporting || members.length === 0}
                  >
                    <Layers className="h-4 w-4" />
                    {exporting ? "A gerar..." : "Todos (PDF)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Definicoes */}
        <CardsSettingsForm
          layout={layout}
          settings={settings}
          settingsLoading={settingsLoading}
          settingsError={settingsError}
          onRetrySettings={() => void refetchSettings()}
          isImperadorRole={isImperadorRole}
          savePending={save.isPending}
          onSave={() => save.mutate()}
          set={set}
        />
      </div>

      {/* Render oculto para exportacao em lote (fora do ecra). */}
      <div
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        {captureData && (
          <MemberCard
            ref={hiddenRef}
            data={captureData}
            width={620}
            side={captureSide}
          />
        )}
      </div>
    </div>
  );
}
