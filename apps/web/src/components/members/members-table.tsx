"use client";

import { ImagePlus } from "lucide-react";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberRowActions } from "@/components/members/member-row-actions";
import {
  isGdprErased,
  memberInitials,
  QUOTA_BADGE,
} from "@/components/members/members-shared";
import { cn } from "@/lib/utils";
import { safeDownloadJson } from "@/lib/safe-download";
import type { Member, PaginatedResult } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

type MembersTableProps = {
  membersPage: PaginatedResult<Member> | undefined;
  members: Member[];
  isInitialLoad: boolean;
  isPageTransition: boolean;
  search: string;
  page: number;
  editingId: string | null;
  canManage: boolean;
  canAccessCards: boolean;
  canManagePhotos: boolean;
  deletePending: boolean;
  grantPortalPending: boolean;
  uploadPhotoPending: boolean;
  emptyIcon: LucideIcon;
  onPageChange: (page: number) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onGrantPortal: (member: Member) => void;
  onGdprErase: (member: Member) => void;
  onUploadPhoto: (memberId: string, file: File) => void;
  onImportClick?: () => void;
  onCreateClick?: () => void;
  onClearFilters?: () => void;
};

export function MembersTable({
  membersPage,
  members,
  isInitialLoad,
  isPageTransition,
  search,
  page,
  editingId,
  canManage,
  canAccessCards,
  canManagePhotos,
  deletePending,
  grantPortalPending,
  uploadPhotoPending,
  emptyIcon: EmptyIcon,
  onPageChange,
  onEdit,
  onDelete,
  onGrantPortal,
  onGdprErase,
  onUploadPhoto,
  onImportClick,
  onCreateClick,
  onClearFilters,
}: MembersTableProps) {
  const showActionsColumn = canManage || canAccessCards;
  const colSpan = showActionsColumn ? 8 : 7;
  return (
    <>
      <Card>
        <CardContent className="p-0">
          {!isInitialLoad && membersPage?.total === 0 && !search ? (
            <EmptyState
              icon={EmptyIcon}
              title="Ainda não há sócios nesta organização"
              description="Importe a lista do Excel ou crie o primeiro sócio."
              actions={[
                ...(canManage && onImportClick
                  ? [
                      {
                        label: "Importar Excel",
                        variant: "outline" as const,
                        onClick: onImportClick,
                      },
                    ]
                  : []),
                ...(canManage && onCreateClick
                  ? [
                      {
                        label: "Criar sócio",
                        onClick: onCreateClick,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div
              className={cn(
                "transition-opacity",
                isPageTransition && "pointer-events-none opacity-60",
              )}
            >
              {/* Desktop: tabela */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Nº</th>
                      <th className="p-3 font-medium">Foto</th>
                      <th className="p-3 font-medium">Nome</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Plano</th>
                      <th className="p-3 font-medium">Quota</th>
                      <th className="p-3 font-medium">Estado</th>
                      {showActionsColumn && (
                        <th className="p-3 font-medium text-right">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isInitialLoad ? (
                      <TableBodySkeleton rows={6} cols={colSpan} />
                    ) : members.length > 0 ? (
                      members.map((m) => (
                        <tr
                          key={m.id}
                          className={`border-b last:border-0 ${editingId === m.id ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3">{m.number}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {m.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.photoUrl}
                                  alt={m.name}
                                  className="h-9 w-9 rounded-md border object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
                                  {memberInitials(m.name)}
                                </div>
                              )}
                              {canManagePhotos && !isGdprErased(m) && (
                                <label className="inline-flex cursor-pointer items-center rounded-md border border-input p-1.5 hover:bg-muted">
                                  <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    disabled={uploadPhotoPending}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) onUploadPhoto(m.id, f);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-medium">
                            {m.name}
                            {isGdprErased(m) && (
                              <Badge variant="muted" className="ml-2">
                                RGPD
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {m.email ?? "-"}
                          </td>
                          <td className="p-3">{m.quotaPlan?.name ?? "-"}</td>
                          <td className="p-3">
                            {m.quotaSituation ? (
                              <Badge
                                variant={
                                  QUOTA_BADGE[m.quotaSituation.status].variant
                                }
                              >
                                {QUOTA_BADGE[m.quotaSituation.status].label}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                m.status === "ACTIVE" ? "success" : "muted"
                              }
                            >
                              {m.status === "ACTIVE" ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          {showActionsColumn && (
                            <td className="p-3">
                              <MemberRowActions
                                member={m}
                                canManage={canManage}
                                canAccessCards={canAccessCards}
                                deletePending={deletePending}
                                grantPortalPending={grantPortalPending}
                                isGdprErased={isGdprErased(m)}
                                onEdit={() => onEdit(m)}
                                onDelete={() => onDelete(m)}
                                onGrantPortal={() => onGrantPortal(m)}
                                onExportGdpr={() =>
                                  void safeDownloadJson(
                                    `/members/${m.id}/gdpr-export`,
                                    `gdpr-export-${m.id}.json`,
                                  )
                                }
                                onGdprErase={() => onGdprErase(m)}
                              />
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={colSpan}
                          className="p-6 text-center text-muted-foreground"
                        >
                          {search ? (
                            <div className="space-y-3">
                              <p>Nenhum sócio encontrado para esta pesquisa.</p>
                              {onClearFilters && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={onClearFilters}
                                >
                                  Limpar filtros
                                </Button>
                              )}
                            </div>
                          ) : (
                            "Sem sócios."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="space-y-3 p-4 sm:hidden">
                {isInitialLoad ? (
                  <MobileCardsSkeleton count={4} />
                ) : members.length > 0 ? (
                  members.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-lg border p-4",
                        editingId === m.id && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Nº {m.number}
                          </p>
                          <p className="font-semibold">
                            {m.name}
                            {isGdprErased(m) && (
                              <Badge variant="muted" className="ml-2">
                                RGPD
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {m.email ?? "-"}
                          </p>
                          <p className="mt-1 text-sm">
                            {m.quotaPlan?.name ?? "Sem plano"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {m.quotaSituation ? (
                            <Badge
                              variant={
                                QUOTA_BADGE[m.quotaSituation.status].variant
                              }
                            >
                              {QUOTA_BADGE[m.quotaSituation.status].label}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              m.status === "ACTIVE" ? "success" : "muted"
                            }
                          >
                            {m.status === "ACTIVE" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      {showActionsColumn && (
                        <div className="mt-3 border-t pt-3">
                          <MemberRowActions
                            member={m}
                            canManage={canManage}
                            canAccessCards={canAccessCards}
                            deletePending={deletePending}
                            grantPortalPending={grantPortalPending}
                            isGdprErased={isGdprErased(m)}
                            onEdit={() => onEdit(m)}
                            onDelete={() => onDelete(m)}
                            onGrantPortal={() => onGrantPortal(m)}
                            onExportGdpr={() =>
                              void safeDownloadJson(
                                `/members/${m.id}/gdpr-export`,
                                `gdpr-export-${m.id}.json`,
                              )
                            }
                            onGdprErase={() => onGdprErase(m)}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {search ? (
                      <div className="space-y-3">
                        <p>Nenhum sócio encontrado para esta pesquisa.</p>
                        {onClearFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                          >
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    ) : (
                      "Sem sócios."
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {membersPage && membersPage.totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {membersPage.page} de {membersPage.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPageTransition}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= membersPage.totalPages || isPageTransition}
              onClick={() => onPageChange(page + 1)}
            >
              {isPageTransition ? "A carregar..." : "Seguinte"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
