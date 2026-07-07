/** Normaliza telefone para link wa.me (digits only, +351 para 9 digitos PT). */
export function normalizeWhatsappPhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D+/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!digits) return null;

  if (digits.length === 9) digits = `351${digits}`;
  return digits;
}

export function buildWhatsappUrl(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}
