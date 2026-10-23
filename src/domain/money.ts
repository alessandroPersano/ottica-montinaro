/** Scompone un prezzo IVA inclusa in imponibile e imposta, in centesimi interi. */
export function splitVatIncluded(
  grossCents: number,
  vatRateBps: number,
): { netCents: number; vatCents: number } {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new Error("L'importo deve essere un intero in centesimi, maggiore o uguale a zero.");
  }
  if (!Number.isInteger(vatRateBps) || vatRateBps < 0 || vatRateBps > 10_000) {
    throw new Error("L'aliquota IVA non è valida.");
  }
  const netCents = Math.round((grossCents * 10_000) / (10_000 + vatRateBps));
  return { netCents, vatCents: grossCents - netCents };
}

export function shippingCents(input: {
  fulfillment: "PICKUP" | "SHIPPING";
  goodsCents: number;
  freeThresholdCents: number;
  flatCents: number;
}): number {
  if (input.fulfillment === "PICKUP") return 0;
  if (input.goodsCents >= input.freeThresholdCents) return 0;
  return input.flatCents;
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
