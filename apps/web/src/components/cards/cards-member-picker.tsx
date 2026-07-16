"use client";

import type { Member } from "@/lib/types";
import { MEMBER_SELECT_CLASS } from "./cards-shared";

type CardsMemberPickerProps = {
  memberId: string;
  setMemberId: (id: string) => void;
  members: Member[];
  membersLoading: boolean;
  membersHasMore: boolean;
  activateMembersPicker: () => void;
};

export function CardsMemberPicker({
  memberId,
  setMemberId,
  members,
  membersLoading,
  membersHasMore,
  activateMembersPicker,
}: CardsMemberPickerProps) {
  return (
    <div className="w-full">
      <label className="text-sm font-medium">Sócio</label>
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        onFocus={activateMembersPicker}
        disabled={membersLoading && members.length === 0}
        className={MEMBER_SELECT_CLASS}
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
          Pesquise em Membros para encontrar mais sócios (50 mostrados).
        </p>
      ) : null}
    </div>
  );
}
