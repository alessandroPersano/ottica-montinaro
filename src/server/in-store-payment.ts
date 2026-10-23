import { eq, sql } from "drizzle-orm";
import { assertInStoreCollection, type InStoreMethod } from "@/domain/collections";
import { canTransitionOrder, canTransitionPayment } from "@/domain/order-state";
import type { AppDatabase } from "@/db/index";
import {
  auditLogs,
  inStorePaymentReceipts,
  orderStatusHistory,
  orders,
  paymentMovements,
  payments,
} from "@/db/schema";

export type CollectionInput = {
  orderId: string;
  operatorId: string;
  method: InStoreMethod;
  amountCents: number;
  idempotencyKey: string;
  receiptReference?: string | null;
  note?: string | null;
  collectedAt: Date;
  cashEnabled: boolean;
  cardEnabled: boolean;
  maxCents: number | null;
};

export type CollectionResult = { duplicate: boolean; paymentId: string };

export async function recordInStoreCollection(
  database: AppDatabase,
  input: CollectionInput,
): Promise<CollectionResult> {
  try {
    return await database.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      const already = existing[0];
      if (already) {
        if (already.orderId !== input.orderId) {
          throw new Error("Questa chiave di registrazione è già stata usata per un altro ordine.");
        }
        return { duplicate: true, paymentId: already.id };
      }

      await tx.execute(sql`select ${orders.id} from ${orders} where ${orders.id} = ${input.orderId} for update`);
      const found = await tx.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      const order = found[0];
      if (!order) throw new Error("Ordine non trovato.");
      if (
        order.paymentStatus === "PAID" ||
        order.paymentStatus === "PARTIALLY_REFUNDED" ||
        order.paymentStatus === "REFUNDED"
      ) {
        throw new Error("Questo incasso risulta già registrato.");
      }

      assertInStoreCollection({
        paymentStatus: order.paymentStatus,
        fulfillment: order.fulfillment,
        expectedCents: order.totalCents,
        collectedCents: input.amountCents,
        method: input.method,
        cashEnabled: input.cashEnabled,
        cardEnabled: input.cardEnabled,
        maxCents: input.maxCents,
      });

      const paymentStep = canTransitionPayment(order.paymentStatus, "PAID");
      if (!paymentStep.ok) throw new Error(paymentStep.message);
      const orderStep = canTransitionOrder(order.status, "PAID");
      if (!orderStep.ok) throw new Error(orderStep.message);

      const method = input.method === "CASH" ? "CASH_AT_PICKUP" : "CARD_AT_PICKUP";
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: order.id,
          origin: "IN_STORE",
          method,
          status: "PAID",
          amountCents: input.amountCents,
          operatorId: input.operatorId,
          idempotencyKey: input.idempotencyKey,
          externalRef: input.receiptReference ?? null,
        })
        .returning();
      if (!payment) throw new Error("Registrazione dell'incasso non riuscita.");

      const [movement] = await tx
        .insert(paymentMovements)
        .values({
          paymentId: payment.id,
          orderId: order.id,
          type: "CHARGE",
          amountCents: input.amountCents,
          operatorId: input.operatorId,
          reason: "Incasso al ritiro",
          externalRef: input.receiptReference ?? null,
        })
        .returning();
      if (!movement) throw new Error("Movimento di incasso non registrato.");

      await tx.insert(inStorePaymentReceipts).values({
        movementId: movement.id,
        method: input.method,
        receiptReference: input.receiptReference ?? null,
        note: input.note ?? null,
        collectedAt: input.collectedAt,
        operatorId: input.operatorId,
      });

      await tx
        .update(orders)
        .set({
          status: "PAID",
          paymentStatus: "PAID",
          paymentMethod: method,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "PAID",
        fromPaymentStatus: order.paymentStatus,
        toPaymentStatus: "PAID",
        actorId: input.operatorId,
        note: "Incasso registrato in negozio",
      });

      if (order.requiresPrescriptionReview) {
        const review = canTransitionOrder("PAID", "PENDING_PRESCRIPTION_REVIEW");
        if (!review.ok) throw new Error(review.message);
        await tx
          .update(orders)
          .set({ status: "PENDING_PRESCRIPTION_REVIEW", updatedAt: new Date() })
          .where(eq(orders.id, order.id));
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          fromStatus: "PAID",
          toStatus: "PENDING_PRESCRIPTION_REVIEW",
          fromPaymentStatus: "PAID",
          toPaymentStatus: "PAID",
          actorId: input.operatorId,
          note: "In attesa di verifica della configurazione",
        });
      }

      await tx.insert(auditLogs).values({
        actorId: input.operatorId,
        action: "in_store.collect",
        entity: "order",
        entityId: order.id,
        metadata: {
          method: input.method,
          amountCents: input.amountCents,
        },
      });

      return { duplicate: false, paymentId: payment.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Questo incasso risulta già registrato.");
    }
    throw error;
  }
}

export async function reverseInStoreMovement(
  database: AppDatabase,
  input: { orderId: string; operatorId: string; amountCents: number; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new Error("Indica il motivo della correzione.");
  }
  return database.transaction(async (tx) => {
    const found = await tx.select().from(payments).where(eq(payments.orderId, input.orderId));
    const payment = found.find((row) => row.origin === "IN_STORE" && row.status === "PAID");
    if (!payment) throw new Error("Non c'è un incasso in negozio da stornare.");
    const step = canTransitionPayment(payment.status, "REFUNDED");
    if (!step.ok) throw new Error(step.message);

    await tx.insert(paymentMovements).values({
      paymentId: payment.id,
      orderId: input.orderId,
      type: "REFUND",
      amountCents: input.amountCents,
      operatorId: input.operatorId,
      reason,
    });
    await tx.update(payments).set({ status: "REFUNDED", reason }).where(eq(payments.id, payment.id));
    await tx
      .update(orders)
      .set({ paymentStatus: "REFUNDED", status: "REFUNDED", updatedAt: new Date() })
      .where(eq(orders.id, input.orderId));
    await tx.insert(orderStatusHistory).values({
      orderId: input.orderId,
      fromStatus: "PAID",
      toStatus: "REFUNDED",
      fromPaymentStatus: "PAID",
      toPaymentStatus: "REFUNDED",
      actorId: input.operatorId,
      note: reason,
    });
    await tx.insert(auditLogs).values({
      actorId: input.operatorId,
      action: "in_store.reverse",
      entity: "order",
      entityId: input.orderId,
      metadata: { amountCents: input.amountCents },
    });
  });
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}
