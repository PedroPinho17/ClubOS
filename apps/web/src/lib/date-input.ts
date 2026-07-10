/** Valor para `<input type="date">` (YYYY-MM-DD) no fuso local. */
export function todayDateInput(): string {
  const d = new Date();
  return formatDateInput(d);
}

export function formatDateInput(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
