"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MemberCard } from "@/components/cards/member-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { canAccessCards } from "@/lib/permissions";
import { redirectSocioFromAdmin } from "@/lib/auth-redirect";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { downloadMemberCardPdf } from "@/lib/card-export";
import { cn } from "@/lib/utils";
import type { CardData } from "@/lib/types";

function MemberCardPrintContent() {
  const params = useParams<{ memberId: string }>();
  const searchParams = useSearchParams();
  const memberId = params.memberId;
  const { data: session } = useSession();
  const { isLoading: authLoading } = useRequireAuth({
    redirectIf: redirectSocioFromAdmin,
  });
  const { effectiveRole, isLoading: roleLoading } = useEffectiveRole();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (effectiveRole && !canAccessCards(effectiveRole)) {
      router.replace("/dashboard");
    }
  }, [authLoading, roleLoading, effectiveRole, router]);

  const cardRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [captureData, setCaptureData] = useState<CardData | null>(null);
  const [captureSide, setCaptureSide] = useState<"front" | "back">("front");
  const [downloading, setDownloading] = useState(false);
  const autoPdfDone = useRef(false);

  const {
    data: cardData,
    isLoading,
    isError,
  } = useQuery<CardData>({
    queryKey: ["card", "print", memberId],
    queryFn: () => api.get<CardData>(`/cards/${memberId}`),
    enabled:
      !!session &&
      !!memberId &&
      !!effectiveRole &&
      canAccessCards(effectiveRole),
  });

  const isCrcVale = cardData?.layout.template === "crc_vale";

  const getCaptureElement = async (
    data: CardData,
    side: "front" | "back",
  ): Promise<HTMLElement | null> => {
    flushSync(() => {
      setCaptureData(data);
      setCaptureSide(side);
    });
    await new Promise((r) => setTimeout(r, 80));
    return hiddenRef.current;
  };

  const downloadPdf = async () => {
    if (!cardData) return;
    setDownloading(true);
    try {
      await downloadMemberCardPdf(
        cardData,
        getCaptureElement,
        `cartao-${cardData.numeroFormatado ?? "socio"}.pdf`,
      );
    } finally {
      flushSync(() => {
        setCaptureData(null);
        setCaptureSide("front");
      });
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("pdf") !== "1" || !cardData || autoPdfDone.current) {
      return;
    }
    autoPdfDone.current = true;
    void downloadPdf();
  }, [searchParams, cardData]);

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        A carregar cartão...
      </div>
    );
  }

  if (isError || !cardData) {
    return (
      <div className="cartao-print-page flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Cartão não disponível.</p>
        <Link
          href="/members"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          ← Voltar aos membros
        </Link>
      </div>
    );
  }

  return (
    <div className="cartao-print-page min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="cartao-print-toolbar mx-auto mb-6 flex max-w-lg flex-wrap items-center gap-2">
        <Link
          href={`/members`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Ficha do sócio
        </Link>
        <Link
          href={`/cards?memberId=${memberId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Personalizar
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir cartão
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void downloadPdf()}
          disabled={downloading}
        >
          <FileText className="h-4 w-4" />
          {downloading ? "A gerar PDF..." : "Descarregar PDF"}
        </Button>
      </div>

      <p className="cartao-print-toolbar mx-auto mb-4 max-w-lg text-sm text-muted-foreground">
        Formato CR80 (85,6 × 54 mm). No diálogo de impressão, escolhe escala
        100% e orientação horizontal.
      </p>

      {isCrcVale && (
        <div className="cartao-print-toolbar mx-auto mb-4 flex max-w-lg gap-2">
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

      <div className="cartao-print-wrap flex justify-center">
        <div ref={cardRef} className="cartao-print-card">
          <MemberCard data={cardData} width={324} side={cardSide} />
        </div>
      </div>

      <p className="cartao-print-toolbar mt-6 text-center text-xs text-muted-foreground">
        {cardData.organization.name}
      </p>

      <div
        ref={hiddenRef}
        className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
        aria-hidden
      >
        {captureData ? (
          <MemberCard data={captureData} width={856} side={captureSide} />
        ) : null}
      </div>
    </div>
  );
}

export default function MemberCardPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          A carregar...
        </div>
      }
    >
      <MemberCardPrintContent />
    </Suspense>
  );
}
