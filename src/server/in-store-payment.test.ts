import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, expect, it } from "vitest";
import { webhookClaimDecision } from "@/domain/collections";
import { createMemoryDatabase } from "@/db";
import { customerProfiles, orders, paymentMovements, stripeEvents, user } from "@/db/schema";
import { recordInStoreCollection } from "@/server/in-store-payment";

async function readyOrder(methodSetup?: { total?: number }) {
  const database = await createMemoryDatabase();
  await migrate(database, { migrationsFolder: "./drizzle" });
  const operatorId = randomUUID();
  const customerId = randomUUID();
  const orderId = randomUUID();
  const total = methodSetup?.total ?? 3200;
  await database.insert(user).values({
    id: operatorId,
    name: "Operatore Demo",
    email: `operatore-${operatorId}@example.com`,
    emailVerified: true,
    role: "OPERATOR",
  });
  await database.insert(customerProfiles).values({
    id: customerId,
    firstName: "Cliente",
    lastName: "Demo",
    email: `cliente-${customerId}@example.com`,
  });
  await database.insert(orders).values({
    id: orderId,
    publicNumber: `OM-TEST-${orderId.slice(0, 8)}`,
    customerId,
    status: "PAYMENT_DUE_AT_PICKUP",
    paymentStatus: "DUE_AT_PICKUP",
    fulfillment: "PICKUP",
    settlement: "PAY_AT_PICKUP",
    subtotalCents: total,
    vatCents: 0,
    shippingCents: 0,
    totalCents: total,
  });
  return { database, operatorId, orderId, total };
}

describe("incasso al ritiro", () => {
  it("registra contanti una sola volta e conserva un solo movimento", async () => {
    const { database, operatorId, orderId, total } = await readyOrder();
    const input = {
      orderId,
      operatorId,
      method: "CASH" as const,
      amountCents: total,
      idempotencyKey: "cassa-1",
      collectedAt: new Date("2026-10-23T10:00:00.000Z"),
      receiptReference: "SCONTRINO-1",
      cashEnabled: true,
      cardEnabled: true,
      maxCents: null,
    };
    const first = await recordInStoreCollection(database, input);
    const replay = await recordInStoreCollection(database, input);
    expect(replay).toEqual({ duplicate: true, paymentId: first.paymentId });
    await expect(
      recordInStoreCollection(database, { ...input, idempotencyKey: "cassa-2" }),
    ).rejects.toThrow(/già registrato/);
    const movements = await database
      .select()
      .from(paymentMovements)
      .where(eq(paymentMovements.orderId, orderId));
    expect(movements).toHaveLength(1);
    expect(movements[0]?.type).toBe("CHARGE");
  });

  it("registra la carta del POS come incasso interno, senza riferimenti Stripe", async () => {
    const { database, operatorId, orderId, total } = await readyOrder({ total: 4500 });
    const result = await recordInStoreCollection(database, {
      orderId,
      operatorId,
      method: "IN_STORE_CARD",
      amountCents: total,
      idempotencyKey: "pos-1",
      collectedAt: new Date("2026-10-23T11:00:00.000Z"),
      receiptReference: "POS-88",
      cashEnabled: true,
      cardEnabled: true,
      maxCents: null,
    });
    expect(result.duplicate).toBe(false);
    const [order] = await database.select().from(orders).where(eq(orders.id, orderId));
    expect(order?.paymentStatus).toBe("PAID");
    expect(order?.paymentMethod).toBe("CARD_AT_PICKUP");
    expect(order?.stripePaymentIntentId).toBeNull();
  });
});

describe("idempotenza webhook", () => {
  it("ignora un evento Stripe già salvato", async () => {
    const database = await createMemoryDatabase();
    await migrate(database, { migrationsFolder: "./drizzle" });
    const inserted = await database
      .insert(stripeEvents)
      .values({ id: "evt_test_1", type: "checkout.session.completed" })
      .returning();
    const duplicate = await database
      .insert(stripeEvents)
      .values({ id: "evt_test_1", type: "checkout.session.completed" })
      .onConflictDoNothing()
      .returning();
    expect(webhookClaimDecision(inserted.length > 0)).toBe("process");
    expect(webhookClaimDecision(duplicate.length > 0)).toBe("skip");
  });
});
