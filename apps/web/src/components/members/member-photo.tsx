"use client";

import { memberInitials } from "@/components/members/members-shared";
import { cn } from "@/lib/utils";

type MemberPhotoProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const SIZE = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-xs",
} as const;

/** Miniatura de foto do sócio (ou iniciais). */
export function MemberPhoto({
  name,
  photoUrl,
  size = "md",
  className,
}: MemberPhotoProps) {
  const box = SIZE[size];
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={photoUrl}
        className={cn(
          "shrink-0 rounded-md border object-cover",
          box,
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border bg-muted font-semibold",
        box,
        className,
      )}
      aria-hidden
    >
      {memberInitials(name)}
    </div>
  );
}
