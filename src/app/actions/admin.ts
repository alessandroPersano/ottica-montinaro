"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLogs, products } from "@/db/schema";
import { parsePriceToCents, parseStockQty } from "@/domain/catalog-edit";
import { recordInStoreCollection } from "@/server/in-store-payment";
import { changeOrderStatus } from "@/server/commerce";
import { requireStaffAction } from "@/server/guard";
import { getSettings } from "@/server/settings";
import { validatePrescription } from "@/server/clinic";

const collectSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["CASH", "IN_STORE_CARD"]),
  amountCents: z.coerce.number().int().positive(),
  idempotencyKey: z.string().min(8),
  receiptReference: z.string().optional(),
  note: z.string().optional(),
});

export async function collectInStore(formData: FormData) {
  const actor = await requireStaffAction("inStorePayment");
  const settings = await getSettings();
  const parsed = collectSchema.safeParse({
    orderId: formData.get("orderId"),
    method: formData.get("method"),
    amountCents: formData.get("amountCents"),
    idempotencyKey: formData.get("idempotencyKey"),
    receiptReference: formData.get("receiptReference") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false as const, message: "Controlla i dati dell'incasso." };
  try {
    await recordInStoreCollection(getDb(), {
      ...parsed.data,
      operatorId: actor.userId,
      collectedAt: new Date(),
      cashEnabled: settings.payAtPickupCash,
      cardEnabled: settings.payAtPickupCard,
      maxCents: settings.payAtPickupMaxCents,
    });
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Incasso non registrato." };
  }
  revalidatePath(`/admin/ordini/${parsed.data.orderId}`);
  return { ok: true as const, message: "Incasso registrato." };
}

export async function moveOrder(formData: FormData) {
  const actor = await requireStaffAction("orders");
  const to = String(formData.get("to") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  try {
    await changeOrderStatus({
      actorId: actor.userId,
      actorRole: actor.role,
      orderId,
      to: to as "CONFIRMED" | "READY_FOR_PICKUP" | "DELIVERED" | "CANCELLED" | "ORDERED_FROM_SUPPLIER" | "SHIPPED",
      note: String(formData.get("note") ?? ""),
      adminOverrideReason: String(formData.get("override") ?? ""),
    });
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Transizione non consentita." };
  }
  revalidatePath(`/admin/ordini/${orderId}`);
  return { ok: true as const, message: "Stato aggiornato." };
}

export async function updateCatalogProduct(formData: FormData) {
  const actor = await requireStaffAction("catalog");
  const productId = String(formData.get("productId") ?? "");
  if (!z.string().uuid().safeParse(productId).success) {
    return { ok: false as const, message: "Prodotto non trovato." };
  }
  const price = parsePriceToCents(String(formData.get("price") ?? ""));
  const stock = parseStockQty(String(formData.get("stock") ?? ""));
  const status = String(formData.get("status") ?? "");
  if (!price.ok) return { ok: false as const, message: price.message };
  if (!stock.ok) return { ok: false as const, message: stock.message };
  if (status !== "ACTIVE" && status !== "DRAFT" && status !== "UNAVAILABLE") {
    return { ok: false as const, message: "Stato non valido." };
  }
  const allowSinglePurchase = formData.get("allowSinglePurchase") === "true";
  const allowSubscription = formData.get("allowSubscription") === "true";
  if (status === "ACTIVE" && price.cents === 0) {
    return { ok: false as const, message: "Per metterla in vendita indica un prezzo maggiore di zero." };
  }
  if ((allowSinglePurchase || allowSubscription) && price.cents === 0) {
    return { ok: false as const, message: "Con prezzo zero la lente non può essere acquistata." };
  }

  const current = await getDb().select().from(products).where(eq(products.id, productId)).limit(1);
  const product = current[0];
  if (!product) return { ok: false as const, message: "Prodotto non trovato." };

  const subscriptionIntervals = allowSubscription
    ? product.subscriptionIntervals.length > 0
      ? product.subscriptionIntervals
      : [30, 60, 90]
    : product.subscriptionIntervals;

  await getDb()
    .update(products)
    .set({
      priceCents: price.cents,
      stockQty: stock.qty,
      status,
      allowSinglePurchase,
      allowSubscription,
      subscriptionIntervals,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
  await getDb().insert(auditLogs).values({
    actorId: actor.userId,
    action: "catalog.update",
    entity: "product",
    entityId: productId,
    metadata: {
      priceCents: price.cents,
      status,
      stockQty: stock.qty,
      allowSinglePurchase,
      allowSubscription,
    },
  });
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/");
  revalidatePath(`/prodotto/${product.slug}`);
  return { ok: true as const, message: "Scheda aggiornata." };
}

export async function validateConfiguration(formData: FormData) {
  const actor = await requireStaffAction("prescriptions");
  await validatePrescription({ prescriptionId: String(formData.get("prescriptionId")), staffId: actor.userId });
  revalidatePath("/admin/prescrizioni");
}
