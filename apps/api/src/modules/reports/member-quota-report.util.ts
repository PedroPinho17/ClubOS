export function daysOverdueFromIso(nextDueIso: string | null): number {
  if (!nextDueIso) return 0;
  const due = new Date(nextDueIso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}
