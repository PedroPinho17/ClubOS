"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CardsPreviewPanel } from "@/components/cards/cards-preview-panel";
import { CardsSettingsForm } from "@/components/cards/cards-settings-form";
import { captureCardImage, CARD_MM } from "@/components/cards/cards-shared";
import { RoleGate } from "@/components/role-gate";
import { useCardsMutations } from "@/hooks/use-cards-mutations";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useMembersPicker } from "@/hooks/use-members-picker";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import { waitForCardImages } from "@/lib/card-export";
import { isImperador } from "@/lib/permissions";
import type { CardData, CardLayout, CardSettings } from "@/lib/types";

const MemberCard = dynamic(
  () => import("@/components/cards/member-card").then((mod) => mod.MemberCard),
  { ssr: false },
);

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

  const { save, uploadPhoto, uploadLogo } = useCardsMutations(memberId);

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
        <CardsPreviewPanel
          memberId={memberId}
          setMemberId={setMemberId}
          members={members}
          membersLoading={membersLoading}
          membersHasMore={membersHasMore}
          activateMembersPicker={activateMembersPicker}
          cardLoading={cardLoading}
          previewData={previewData}
          isCrcVale={!!isCrcVale}
          cardSide={cardSide}
          setCardSide={setCardSide}
          cardRef={cardRef}
          uploadPhotoPending={uploadPhoto.isPending}
          uploadLogoPending={uploadLogo.isPending}
          onUploadPhoto={(file) => uploadPhoto.mutate(file)}
          onUploadLogo={(file) => uploadLogo.mutate(file)}
          onExportPng={exportPng}
          onExportPdf={exportPdf}
          onExportAllPdf={exportAllPdf}
          exporting={exporting}
        />

        <CardsSettingsForm
          layout={layout}
          settings={settings}
          settingsLoading={settingsLoading}
          settingsError={settingsError}
          onRetrySettings={() => void refetchSettings()}
          isImperadorRole={isImperadorRole}
          savePending={save.isPending}
          onSave={() =>
            save.mutate(layoutDraft, {
              onSuccess: (res) => setLayoutDraft(res.layout),
            })
          }
          set={set}
        />
      </div>

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
