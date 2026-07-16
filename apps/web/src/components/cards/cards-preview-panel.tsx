"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFluidCardWidth } from "@/hooks/use-portal-card-width";
import type { CardData } from "@/lib/types";
import { CardsExportControls } from "./cards-export-controls";
import { CardsMemberPicker } from "./cards-member-picker";
import { CARD_PREVIEW_MAX_WIDTH } from "./cards-shared";

function previewHeight(width: number) {
  return width * (540 / 856);
}

const MemberCard = dynamic(
  () => import("@/components/cards/member-card").then((mod) => mod.MemberCard),
  {
    loading: () => (
      <Skeleton className="h-[265px] w-full max-w-[420px] rounded-[24px] shadow-lg" />
    ),
    ssr: false,
  },
);

type CardsPreviewPanelProps = {
  memberId: string;
  setMemberId: (id: string) => void;
  members: Parameters<typeof CardsMemberPicker>[0]["members"];
  membersLoading: boolean;
  membersHasMore: boolean;
  activateMembersPicker: () => void;
  cardLoading: boolean;
  previewData: CardData | null;
  isCrcVale: boolean;
  cardSide: "front" | "back";
  setCardSide: (side: "front" | "back") => void;
  cardRef: RefObject<HTMLDivElement | null>;
  uploadPhotoPending: boolean;
  uploadLogoPending: boolean;
  onUploadPhoto: (file: File) => void;
  onUploadLogo: (file: File) => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportAllPdf: () => void;
  exporting: boolean;
};

export function CardsPreviewPanel({
  memberId,
  setMemberId,
  members,
  membersLoading,
  membersHasMore,
  activateMembersPicker,
  cardLoading,
  previewData,
  isCrcVale,
  cardSide,
  setCardSide,
  cardRef,
  uploadPhotoPending,
  uploadLogoPending,
  onUploadPhoto,
  onUploadLogo,
  onExportPng,
  onExportPdf,
  onExportAllPdf,
  exporting,
}: CardsPreviewPanelProps) {
  const previewWidth = useFluidCardWidth({
    min: 280,
    max: CARD_PREVIEW_MAX_WIDTH,
    padding: 64,
  });
  const height = previewHeight(previewWidth);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <CardsMemberPicker
            memberId={memberId}
            setMemberId={setMemberId}
            members={members}
            membersLoading={membersLoading}
            membersHasMore={membersHasMore}
            activateMembersPicker={activateMembersPicker}
          />

          {cardLoading || !previewData ? (
            <Skeleton
              className="rounded-[24px] shadow-lg"
              style={{ width: previewWidth, height }}
            />
          ) : (
            <>
              {isCrcVale && (
                <div className="flex w-full max-w-[420px] gap-2">
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
                width={previewWidth}
                side={cardSide}
              />
            </>
          )}

          {previewData && (
            <p className="text-xs text-muted-foreground">
              A pré-visualização reflecte alterações antes de guardar.
            </p>
          )}

          <CardsExportControls
            memberId={memberId}
            previewReady={!!previewData}
            uploadPhotoPending={uploadPhotoPending}
            uploadLogoPending={uploadLogoPending}
            onUploadPhoto={onUploadPhoto}
            onUploadLogo={onUploadLogo}
            onExportPng={onExportPng}
            onExportPdf={onExportPdf}
            onExportAllPdf={onExportAllPdf}
            exporting={exporting}
            membersCount={members.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}
