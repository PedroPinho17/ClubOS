"use client";

import { Download, FileText, ImagePlus, Layers, Printer } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CardsExportControlsProps = {
  memberId: string;
  previewReady: boolean;
  uploadPhotoPending: boolean;
  uploadLogoPending: boolean;
  onUploadPhoto: (file: File) => void;
  onUploadLogo: (file: File) => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportAllPdf: () => void;
  exporting: boolean;
  membersCount: number;
};

export function CardsExportControls({
  memberId,
  previewReady,
  uploadPhotoPending,
  uploadLogoPending,
  onUploadPhoto,
  onUploadLogo,
  onExportPng,
  onExportPdf,
  onExportAllPdf,
  exporting,
  membersCount,
}: CardsExportControlsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
          <ImagePlus className="h-4 w-4" />
          {uploadPhotoPending ? "A enviar..." : "Foto"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={!memberId || uploadPhotoPending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadPhoto(f);
              e.target.value = "";
            }}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
          <ImagePlus className="h-4 w-4" />
          {uploadLogoPending ? "A enviar..." : "Logótipo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            disabled={uploadLogoPending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadLogo(f);
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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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
          onClick={onExportPng}
          disabled={!previewReady}
        >
          <Download className="h-4 w-4" />
          PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPdf}
          disabled={!previewReady}
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={onExportAllPdf}
          disabled={exporting || membersCount === 0}
        >
          <Layers className="h-4 w-4" />
          {exporting ? "A gerar..." : "Todos (PDF)"}
        </Button>
      </div>
    </div>
  );
}
