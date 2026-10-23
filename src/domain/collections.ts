/** Il primo inserimento dell'event id viene elaborato. I duplicati si ignorano. */
export function webhookClaimDecision(inserted: boolean): "process" | "skip" {
  return inserted ? "process" : "skip";
}

export type InStoreMethod = "CASH" | "IN_STORE_CARD";

export function assertInStoreCollection(input: {
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "DUE_AT_PICKUP" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED" | "VOIDED";
  fulfillment: "PICKUP" | "SHIPPING";
  expectedCents: number;
  collectedCents: number;
  method: InStoreMethod;
  cashEnabled: boolean;
  cardEnabled: boolean;
  maxCents: number | null;
}): void {
  if (input.fulfillment !== "PICKUP") {
    throw new Error("L'incasso in negozio è disponibile solo per il ritiro.");
  }
  if (input.paymentStatus !== "DUE_AT_PICKUP") {
    throw new Error("Questo ordine non ha un pagamento da registrare al ritiro.");
  }
  if (!Number.isInteger(input.collectedCents) || input.collectedCents !== input.expectedCents) {
    throw new Error("L'importo incassato deve coincidere con il totale dovuto.");
  }
  if (input.maxCents != null && input.collectedCents > input.maxCents) {
    throw new Error("L'importo supera il massimo consentito per il pagamento al ritiro.");
  }
  if (input.method === "CASH" && !input.cashEnabled) {
    throw new Error("Il pagamento in contanti non è abilitato.");
  }
  if (input.method === "IN_STORE_CARD" && !input.cardEnabled) {
    throw new Error("Il pagamento con carta in negozio non è abilitato.");
  }
}
