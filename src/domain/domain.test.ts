import { describe, expect, it } from "vitest";
import { assertInStoreCollection, webhookClaimDecision } from "@/domain/collections";
import { earliestSupplyDays, supplyDaysForEye } from "@/domain/consumption";
import { classifyDeadline, deadlineDiffDays, nextDeadlineDateKey } from "@/domain/deadlines";
import { parsePriceToCents, parseStockQty } from "@/domain/catalog-edit";
import { shippingCents, splitVatIncluded } from "@/domain/money";
import { canMarkDelivered, canTransitionOrder, canTransitionPayment } from "@/domain/order-state";
import { validateEyeParameters, type ParameterRules } from "@/domain/parameters";
import { assertPrivacyAccepted, marketingChoice } from "@/domain/privacy";
import { reminderIdempotencyKey, reminderIsDue } from "@/domain/reminders";
import { assertCan, canAccessRecord, canPerform } from "@/domain/roles";
import { addCalendarDays, romeDateKey } from "@/domain/time";

const dailyRules: ParameterRules = {
  geometry: "SPHERICAL",
  sphereMin: -8,
  sphereMax: 4,
  sphereStep: 0.25,
  additionOptions: [],
  baseCurveOptions: ["8.6"],
  diameterOptions: ["14.2"],
  dominanceOptions: [],
  colorOptions: [],
};

const toricRules: ParameterRules = {
  ...dailyRules,
  geometry: "TORIC",
  cylinderMin: -2.25,
  cylinderMax: -0.75,
  cylinderStep: 0.25,
  axisMin: 10,
  axisMax: 180,
  axisStep: 10,
};

describe("scadenze e consumo", () => {
  it("calcola i giorni di copertura per occhio", () => {
    expect(supplyDaysForEye({ lensesPerPack: 30, packs: 1, replacementFrequencyDays: 1 })).toBe(30);
    expect(supplyDaysForEye({ lensesPerPack: 6, packs: 2, replacementFrequencyDays: 30 })).toBe(360);
  });

  it("usa la durata manuale quando è indicata", () => {
    expect(
      supplyDaysForEye({
        lensesPerPack: 30,
        packs: 1,
        replacementFrequencyDays: 1,
        manualDurationDays: 45,
      }),
    ).toBe(45);
  });

  it("prende la copertura più breve fra i due occhi", () => {
    const right = supplyDaysForEye({ lensesPerPack: 30, packs: 1, replacementFrequencyDays: 1 });
    const left = supplyDaysForEye({ lensesPerPack: 30, packs: 2, replacementFrequencyDays: 1 });
    expect(earliestSupplyDays([right, left])).toBe(30);
  });

  it("deriva la data di scadenza nel calendario di Roma", () => {
    const delivered = new Date("2026-03-28T23:30:00.000Z");
    expect(romeDateKey(delivered)).toBe("2026-03-29");
    expect(nextDeadlineDateKey(delivered, 30)).toBe("2026-04-28");
    expect(romeDateKey(new Date("2026-10-24T22:30:00.000Z"))).toBe("2026-10-25");
  });

  it("classifica futura, in avvicinamento, imminente, oggi e scaduta", () => {
    expect(classifyDeadline(40, {})).toBe("FUTURE");
    expect(classifyDeadline(20, {})).toBe("APPROACHING");
    expect(classifyDeadline(7, {})).toBe("IMMINENT");
    expect(classifyDeadline(0, {})).toBe("TODAY");
    expect(classifyDeadline(-1, {})).toBe("OVERDUE");
    expect(classifyDeadline(-3, { reordered: true })).toBe("REORDERED");
    expect(classifyDeadline(2, { suspended: true })).toBe("SUSPENDED");
    expect(deadlineDiffDays("2026-10-30", new Date("2026-10-23T10:00:00.000Z"))).toBe(7);
  });

  it("aggiunge giorni civili oltre il cambio mese", () => {
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("ordini e pagamenti", () => {
  it("blocca le transizioni incompatibili", () => {
    expect(canTransitionOrder("DRAFT", "DELIVERED").ok).toBe(false);
    expect(canTransitionOrder("PENDING_PAYMENT", "PAID").ok).toBe(true);
    expect(canTransitionOrder("PAYMENT_DUE_AT_PICKUP", "PAID").ok).toBe(true);
    expect(canTransitionOrder("SHIPPED", "CANCELLED").ok).toBe(false);
    expect(canTransitionPayment("DUE_AT_PICKUP", "PAID").ok).toBe(true);
    expect(canTransitionPayment("PAID", "PENDING").ok).toBe(false);
    expect(canTransitionPayment("PAID", "REFUNDED").ok).toBe(true);
    expect(canTransitionPayment("FAILED", "VOIDED").ok).toBe(true);
  });

  it("impedisce la consegna se il saldo è dovuto, salvo override dell'amministratore", () => {
    const blocked = canMarkDelivered({
      from: "READY_FOR_PICKUP",
      paymentStatus: "DUE_AT_PICKUP",
      actorRole: "OPERATOR",
    });
    expect(blocked.ok).toBe(false);

    const override = canMarkDelivered({
      from: "READY_FOR_PICKUP",
      paymentStatus: "DUE_AT_PICKUP",
      actorRole: "ADMIN",
      adminOverrideReason: "Cliente abituale, incasso differito",
    });
    expect(override.ok).toBe(true);

    const paid = canMarkDelivered({
      from: "READY_FOR_PICKUP",
      paymentStatus: "PAID",
      actorRole: "OPERATOR",
    });
    expect(paid.ok).toBe(true);
  });

  it("accetta l'incasso al ritiro solo se importo, metodo e stato coincidono", () => {
    expect(() =>
      assertInStoreCollection({
        paymentStatus: "DUE_AT_PICKUP",
        fulfillment: "PICKUP",
        expectedCents: 2590,
        collectedCents: 2590,
        method: "CASH",
        cashEnabled: true,
        cardEnabled: true,
        maxCents: null,
      }),
    ).not.toThrow();

    expect(() =>
      assertInStoreCollection({
        paymentStatus: "PAID",
        fulfillment: "PICKUP",
        expectedCents: 2590,
        collectedCents: 2590,
        method: "IN_STORE_CARD",
        cashEnabled: true,
        cardEnabled: true,
        maxCents: null,
      }),
    ).toThrow(/non ha un pagamento/);
  });

  it("calcola IVA inclusa e spedizione in centesimi", () => {
    expect(splitVatIncluded(1220, 2200)).toEqual({ netCents: 1000, vatCents: 220 });
    expect(shippingCents({ fulfillment: "PICKUP", goodsCents: 1000, freeThresholdCents: 6000, flatCents: 590 })).toBe(0);
    expect(shippingCents({ fulfillment: "SHIPPING", goodsCents: 1000, freeThresholdCents: 6000, flatCents: 590 })).toBe(590);
    expect(shippingCents({ fulfillment: "SHIPPING", goodsCents: 6000, freeThresholdCents: 6000, flatCents: 590 })).toBe(0);
  });
});

describe("parametri, privacy, promemoria, ruoli, webhook", () => {
  it("valida sfera, toriche e valori fuori gamma", () => {
    expect(
      validateEyeParameters(dailyRules, { sphere: -1.25, baseCurve: "8.6", diameter: "14.2" }),
    ).toEqual([]);
    expect(
      validateEyeParameters(dailyRules, { sphere: -1.1, baseCurve: "8.6", diameter: "14.2" }).length,
    ).toBeGreaterThan(0);
    expect(
      validateEyeParameters(toricRules, {
        sphere: -2,
        cylinder: -1.25,
        axis: 180,
        baseCurve: "8.6",
        diameter: "14.2",
      }),
    ).toEqual([]);
    expect(
      validateEyeParameters(toricRules, { sphere: -2, baseCurve: "8.6", diameter: "14.2" }).join(" "),
    ).toMatch(/torica/);
  });

  it("rende obbligatoria l'accettazione privacy e lascia il marketing facoltativo", () => {
    expect(() => assertPrivacyAccepted(false)).toThrow(/Informativa Privacy/);
    expect(() => assertPrivacyAccepted(true)).not.toThrow();
    expect(marketingChoice(undefined)).toBe(false);
    expect(marketingChoice(false)).toBe(false);
    expect(marketingChoice(true)).toBe(true);
  });

  it("genera una sola chiave di promemoria per lo stesso invio", () => {
    const first = reminderIdempotencyKey({
      deadlineId: "d1",
      offsetDays: -7,
      dueDate: "2026-11-01",
      channel: "EMAIL",
    });
    const duplicate = reminderIdempotencyKey({
      deadlineId: "d1",
      offsetDays: -7,
      dueDate: "2026-11-01",
      channel: "EMAIL",
    });
    const moved = reminderIdempotencyKey({
      deadlineId: "d1",
      offsetDays: -7,
      dueDate: "2026-11-08",
      channel: "EMAIL",
    });
    expect(first).toBe(duplicate);
    expect(moved).not.toBe(first);
    expect(reminderIsDue(7, -7)).toBe(true);
    expect(reminderIsDue(7, -14)).toBe(false);
    expect(reminderIsDue(0, 0)).toBe(true);
    expect(reminderIsDue(-7, 7)).toBe(true);
  });

  it("applica i ruoli e la proprietà dei dati", () => {
    expect(canPerform("OPERATOR", "orders")).toBe(true);
    expect(canPerform("OPERATOR", "settings")).toBe(false);
    expect(canPerform("CUSTOMER", "orders")).toBe(false);
    expect(() => assertCan("CUSTOMER", "audit")).toThrow(/autorizzazione/);
    expect(canAccessRecord({ role: "CUSTOMER", actorUserId: "a", ownerUserId: "b" })).toBe(false);
    expect(canAccessRecord({ role: "CUSTOMER", actorUserId: "a", ownerUserId: "a" })).toBe(true);
    expect(canAccessRecord({ role: "OPERATOR", actorUserId: "op", ownerUserId: "a" })).toBe(true);
  });

  it("legge prezzo e giacenza inseriti in tabella", () => {
    expect(parsePriceToCents("12,50")).toEqual({ ok: true, cents: 1250 });
    expect(parsePriceToCents("0")).toEqual({ ok: true, cents: 0 });
    expect(parsePriceToCents("12.555").ok).toBe(false);
    expect(parseStockQty("")).toEqual({ ok: true, qty: null });
    expect(parseStockQty("8")).toEqual({ ok: true, qty: 8 });
    expect(parseStockQty("-1").ok).toBe(false);
  });

  it("tratta un evento Stripe già visto come da ignorare", () => {
    expect(webhookClaimDecision(true)).toBe("process");
    expect(webhookClaimDecision(false)).toBe("skip");
  });
});
