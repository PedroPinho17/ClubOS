"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import type { MemberImportResult } from "@/lib/types";
import { useMembersMutations } from "@/hooks/use-members-mutations";

/** Estado e orquestração do import Excel (dry-run → confirmação → real). */
export function useMemberImport() {
  const { importMembers } = useMembersMutations();
  const importInputRef = useRef<HTMLInputElement>(null);
  const pendingImportFileRef = useRef<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importDryRun, setImportDryRun] = useState(false);
  const [importResult, setImportResult] = useState<MemberImportResult | null>(
    null,
  );
  const [importWarningOpen, setImportWarningOpen] = useState(false);
  const [hasPendingImport, setHasPendingImport] = useState(false);

  function clearPending() {
    pendingImportFileRef.current = null;
    setHasPendingImport(false);
  }

  function runImport(file: File, dryRun: boolean) {
    pendingImportFileRef.current = file;
    setHasPendingImport(true);
    importMembers.mutate(
      { file, dryRun, updateExisting },
      {
        onSuccess: (res) => {
          if (!res.dryRun) {
            clearPending();
            setImportWarningOpen(false);
            toast.success("Importação concluída");
          }
          setImportResult(res);
        },
      },
    );
  }

  function confirmRealImport() {
    const file = pendingImportFileRef.current;
    if (!file) return;
    importMembers.mutate(
      { file, dryRun: false, updateExisting },
      {
        onSuccess: (res) => {
          clearPending();
          setImportWarningOpen(false);
          setImportResult(res);
          toast.success("Importação concluída");
        },
      },
    );
  }

  function handleConfirmImport() {
    if (!importResult || !pendingImportFileRef.current) return;
    if (importResult.errors.length > 0) {
      setImportWarningOpen(true);
      return;
    }
    toast.info("A iniciar importação...");
    confirmRealImport();
  }

  function dismissResult() {
    setImportResult(null);
    clearPending();
  }

  return {
    importInputRef,
    updateExisting,
    setUpdateExisting,
    importDryRun,
    setImportDryRun,
    importResult,
    importWarningOpen,
    setImportWarningOpen,
    hasPendingImport,
    importPending: importMembers.isPending,
    runImport,
    confirmRealImport,
    handleConfirmImport,
    dismissResult,
    openFilePicker: () => importInputRef.current?.click(),
  };
}
