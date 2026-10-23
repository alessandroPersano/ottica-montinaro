export function parsePriceToCents(raw: string): { ok: true; cents: number } | { ok: false; message: string } {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, message: "Indica il prezzo in euro, con al massimo due decimali." };
  }
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros > 9999) {
    return { ok: false, message: "Il prezzo non è accettabile." };
  }
  return { ok: true, cents: Math.round(euros * 100) };
}

export function parseStockQty(raw: string): { ok: true; qty: number | null } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, qty: null };
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, message: "La giacenza è un numero intero, oppure vuota se non la gestisci." };
  }
  const qty = Number(trimmed);
  if (qty > 100_000) return { ok: false, message: "La giacenza indicata è troppo alta." };
  return { ok: true, qty };
}
