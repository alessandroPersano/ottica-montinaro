import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { addCalendarDays, romeDateKey } from "@/domain/time";
import { shippingCents, splitVatIncluded } from "@/domain/money";
import { canMarkDelivered, canTransitionOrder, type OrderStatus } from "@/domain/order-state";
import type { AppDatabase } from "@/db";
import { getDb } from "@/db";
import {
  addresses,
  auditLogs,
  cartItems,
  carts,
  customerProfiles,
  deadlines,
  inventoryMovements,
  orderCounters,
  orderItems,
  orderStatusHistory,
  orders,
  pickupReservations,
  prescriptions,
  products,
} from "@/db/schema";
import { getSettings } from "@/server/settings";
import { renderServiceEmail, sendTransactionalEmail } from "@/server/email";

type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

export async function getCart(userId: string) {
  const database = getDb();
  const existing = await database.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  const cart = existing[0] ?? (await database.insert(carts).values({ userId }).returning())[0];
  if (!cart) throw new Error("Carrello non disponibile.");
  const items = await database
    .select({
      id: cartItems.id,
      eye: cartItems.eye,
      quantity: cartItems.quantity,
      purchaseMode: cartItems.purchaseMode,
      intervalDays: cartItems.intervalDays,
      prescriptionId: cartItems.prescriptionId,
      productId: products.id,
      name: products.commercialName,
      priceCents: products.priceCents,
      vatRateBps: products.vatRateBps,
      sku: products.sku,
      allowSubscription: products.allowSubscription,
      subscriptionIntervals: products.subscriptionIntervals,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.cartId, cart.id));
  return { cart, items };
}

export async function addCartItem(input: {
  userId: string;
  productId: string;
  eye: "RIGHT" | "LEFT";
  quantity: number;
  purchaseMode: "ONE_TIME" | "SUBSCRIPTION";
  intervalDays?: number | null;
  prescriptionId?: string | null;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 24) {
    throw new Error("Indica una quantità tra 1 e 24.");
  }
  const { cart } = await getCart(input.userId);
  await getDb().insert(cartItems).values({
    cartId: cart.id,
    productId: input.productId,
    eye: input.eye,
    quantity: input.quantity,
    purchaseMode: input.purchaseMode,
    intervalDays: input.intervalDays ?? null,
    prescriptionId: input.prescriptionId ?? null,
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  const { cart } = await getCart(userId);
  await getDb().delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
}

export async function placeOrder(input: {
  userId: string;
  fulfillment: "PICKUP" | "SHIPPING";
  settlement: "ONLINE" | "PAY_AT_PICKUP";
  shippingAddressId?: string | null;
  customerNote?: string | null;
}) {
  const settings = await getSettings();
  const profileRows = await getDb()
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, input.userId))
    .limit(1);
  const profile = profileRows[0];
  if (!profile) throw new Error("Completa il profilo prima di ordinare.");
  const { cart, items } = await getCart(input.userId);
  if (items.length === 0) throw new Error("Il carrello è vuoto.");

  const modes = new Set(items.map((item) => item.purchaseMode));
  if (modes.size > 1) {
    throw new Error("Separa l'acquisto singolo dall'abbonamento: fai due ordini.");
  }
  const subscription = items[0]?.purchaseMode === "SUBSCRIPTION";
  if (subscription && input.settlement === "PAY_AT_PICKUP") {
    throw new Error("L'abbonamento richiede un pagamento ricorrente con carta. Il contante al ritiro non è disponibile.");
  }
  if (input.settlement === "PAY_AT_PICKUP") {
    if (input.fulfillment !== "PICKUP") throw new Error("Puoi pagare al ritiro solo se ritiri in negozio.");
    if (!settings.payAtPickupEnabled) throw new Error("Il pagamento al ritiro non è attivo.");
  }
  if (input.fulfillment === "SHIPPING" && !input.shippingAddressId) {
    throw new Error("Indica l'indirizzo di spedizione.");
  }

  const created = await getDb().transaction(async (tx) => {
    let goods = 0;
    let vat = 0;
    let review = false;
    const lines: Array<{
      productId: string;
      eye: "RIGHT" | "LEFT";
      quantity: number;
      productName: string;
      sku: string;
      unitPriceCents: number;
      vatRateBps: number;
      prescriptionId: string | null;
    }> = [];

    for (const item of items) {
      const productRows = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
      const product = productRows[0];
      if (!product || product.status !== "ACTIVE") throw new Error("Un prodotto del carrello non è disponibile.");
      if (product.stockQty != null && product.stockQty < item.quantity) {
        throw new Error(`Disponibilità insufficiente per ${product.commercialName}.`);
      }
      if (subscription && !product.allowSubscription) throw new Error(`${product.commercialName} non è in abbonamento.`);
      if (!subscription && !product.allowSinglePurchase) throw new Error(`${product.commercialName} si acquista solo in abbonamento.`);
      const line = product.priceCents * item.quantity;
      goods += line;
      vat += splitVatIncluded(line, product.vatRateBps).vatCents;
      if (item.prescriptionId) {
        const prescriptionRows = await tx
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.id, item.prescriptionId))
          .limit(1);
        const prescription = prescriptionRows[0];
        const usable =
          prescription?.status === "VALIDATED" &&
          prescription.expiresAt != null &&
          prescription.expiresAt.getTime() > Date.now();
        if (!usable) review = true;
      } else {
        review = true;
      }
      lines.push({
        productId: product.id,
        eye: item.eye,
        quantity: item.quantity,
        productName: product.commercialName,
        sku: product.sku,
        unitPriceCents: product.priceCents,
        vatRateBps: product.vatRateBps,
        prescriptionId: item.prescriptionId,
      });
    }

    const shipping = shippingCents({
      fulfillment: input.fulfillment,
      goodsCents: goods,
      freeThresholdCents: settings.freeShippingThresholdCents,
      flatCents: settings.shippingCostCents,
    });
    const total = goods + shipping;
    if (input.settlement === "PAY_AT_PICKUP" && settings.payAtPickupMaxCents != null && total > settings.payAtPickupMaxCents) {
      throw new Error("L'importo supera il massimo previsto per il pagamento al ritiro.");
    }

    const publicNumber = await nextPublicNumber(tx);
    const status = input.settlement === "PAY_AT_PICKUP" ? "PAYMENT_DUE_AT_PICKUP" : "PENDING_PAYMENT";
    const paymentStatus = input.settlement === "PAY_AT_PICKUP" ? "DUE_AT_PICKUP" : "PENDING";
    const [order] = await tx
      .insert(orders)
      .values({
        publicNumber,
        customerId: profile.id,
        userId: input.userId,
        status,
        paymentStatus,
        fulfillment: input.fulfillment,
        settlement: input.settlement,
        subtotalCents: goods,
        vatCents: vat,
        shippingCents: shipping,
        totalCents: total,
        customerNote: input.customerNote ?? null,
        requiresPrescriptionReview: review,
        shippingAddressId: input.shippingAddressId ?? null,
        prescriptionId: lines.find((line) => line.prescriptionId)?.prescriptionId ?? null,
      })
      .returning();
    if (!order) throw new Error("Ordine non creato.");

    await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId: order.id })));
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: status,
      toPaymentStatus: paymentStatus,
      actorId: input.userId,
      note: "Ordine creato",
    });

    if (input.settlement === "PAY_AT_PICKUP") {
      for (const line of lines) {
        await tx
          .update(products)
          .set({ stockQty: sql`case when ${products.stockQty} is null then null else ${products.stockQty} - ${line.quantity} end` })
          .where(eq(products.id, line.productId));
        await tx.insert(inventoryMovements).values({
          productId: line.productId,
          delta: -line.quantity,
          reason: "RESERVE",
          orderId: order.id,
          actorId: input.userId,
        });
      }
      const untilKey = addCalendarDays(romeDateKey(new Date()), settings.pickupReservationDays);
      await tx.insert(pickupReservations).values({
        orderId: order.id,
        reservedUntil: new Date(`${untilKey}T21:00:00.000Z`),
        status: "ACTIVE",
      });
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await tx.insert(auditLogs).values({
      actorId: input.userId,
      action: "order.create",
      entity: "order",
      entityId: order.id,
      metadata: { settlement: input.settlement, totalCents: total },
    });
    return order;
  });

  if (created.settlement === "PAY_AT_PICKUP" && profile.email) {
    const html = await renderServiceEmail({
      preview: `Ordine ${created.publicNumber} da pagare al ritiro`,
      greeting: `Ciao ${profile.firstName},`,
      paragraphs: [
        `Abbiamo prenotato l'ordine ${created.publicNumber}. Non risulta pagato online.`,
        `Importo da pagare in negozio: ${(created.totalCents / 100).toFixed(2)} euro. Potrai pagare in negozio in contanti o con carta.`,
        `Ritiro: ${settings.pickupAddress}. ${settings.pickupInstructions}`,
      ],
      ctaHref: `${process.env.NEXT_PUBLIC_APP_URL}/area-personale/ordini/${created.id}`,
      ctaLabel: "Apri l'ordine",
    });
    await sendTransactionalEmail({
      to: profile.email,
      subject: `Prenotazione ${created.publicNumber} — da pagare al ritiro`,
      html,
      category: "service",
    });
  }

  return created;
}

export async function changeOrderStatus(input: {
  actorId: string;
  actorRole: "ADMIN" | "OPERATOR" | "CUSTOMER";
  orderId: string;
  to: OrderStatus;
  note?: string | null;
  adminOverrideReason?: string | null;
}) {
  const orderRows = await getDb().select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  const order = orderRows[0];
  if (!order) throw new Error("Ordine non trovato.");

  if (input.to === "DELIVERED") {
    const decision = canMarkDelivered({
      from: order.status,
      paymentStatus: order.paymentStatus,
      actorRole: input.actorRole,
      adminOverrideReason: input.adminOverrideReason,
    });
    if (!decision.ok) throw new Error(decision.message);
  } else {
    const decision = canTransitionOrder(order.status, input.to);
    if (!decision.ok) throw new Error(decision.message);
  }

  await getDb().transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: input.to,
        deliveryOverrideReason: input.adminOverrideReason ?? order.deliveryOverrideReason,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: input.to,
      fromPaymentStatus: order.paymentStatus,
      toPaymentStatus: order.paymentStatus,
      actorId: input.actorId,
      note: input.note ?? input.adminOverrideReason ?? null,
    });
    if (input.to === "DELIVERED") {
      await createDeadlineForOrder(tx, order.id);
    }
    await tx.insert(auditLogs).values({
      actorId: input.actorId,
      action: "order.transition",
      entity: "order",
      entityId: order.id,
      metadata: { to: input.to },
    });
  });

  if (input.to === "READY_FOR_PICKUP") {
    const profile = await getDb()
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.id, order.customerId))
      .limit(1);
    const email = profile[0]?.email;
    if (email) {
      const settings = await getSettings();
      const due = order.paymentStatus === "DUE_AT_PICKUP";
      const html = await renderServiceEmail({
        preview: `Ordine ${order.publicNumber} pronto`,
        greeting: `Ciao ${profile[0]?.firstName ?? ""},`,
        paragraphs: [
          `L'ordine ${order.publicNumber} è pronto per il ritiro.`,
          due
            ? `Resta da pagare ${(order.totalCents / 100).toFixed(2)} euro. Potrai pagare in negozio in contanti o con carta.`
            : "Risulta già pagato online.",
          settings.pickupAddress,
        ],
        ctaHref: `${process.env.NEXT_PUBLIC_APP_URL}/area-personale`,
        ctaLabel: "Area personale",
      });
      await sendTransactionalEmail({
        to: email,
        subject: `Ordine ${order.publicNumber} pronto per il ritiro`,
        html,
        category: "service",
      });
    }
  }
}

async function nextPublicNumber(tx: Tx) {
  const year = Number(romeDateKey(new Date()).slice(0, 4));
  const rows = await tx
    .insert(orderCounters)
    .values({ year, lastValue: 1 })
    .onConflictDoUpdate({
      target: orderCounters.year,
      set: { lastValue: sql`${orderCounters.lastValue} + 1` },
    })
    .returning();
  const value = rows[0]?.lastValue ?? 1;
  return `OM-${year}-${String(value).padStart(5, "0")}`;
}

async function createDeadlineForOrder(tx: Tx, orderId: string) {
  const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0];
  if (!order) return;
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))] as string[];
  let supply = Number.POSITIVE_INFINITY;
  for (const productId of productIds) {
    const productRows = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    const product = productRows[0];
    if (!product) continue;
    const qty = items.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0);
    supply = Math.min(supply, product.lensesPerPack * Math.max(1, qty) * product.replacementFrequencyDays);
  }
  if (!Number.isFinite(supply) || supply < 1) supply = 30;
  const dueOn = addCalendarDays(romeDateKey(new Date()), Math.max(1, supply));
  await tx.insert(deadlines).values({
    customerId: order.customerId,
    orderId: order.id,
    prescriptionId: order.prescriptionId,
    dueOn,
    calculatedDueOn: dueOn,
    status: "FUTURE",
    supplyDays: Math.max(1, supply),
    eyesCovered: new Set(items.map((item) => item.eye)).size,
  });
}

export async function listCustomerAddresses(customerId: string) {
  return getDb().select().from(addresses).where(eq(addresses.customerId, customerId));
}

export async function saveAddress(input: {
  customerId: string;
  kind: "BILLING" | "SHIPPING";
  line1: string;
  postalCode: string;
  city: string;
  province: string;
}) {
  await getDb().insert(addresses).values({
    id: randomUUID(),
    customerId: input.customerId,
    kind: input.kind,
    line1: input.line1,
    postalCode: input.postalCode,
    city: input.city,
    province: input.province.toUpperCase(),
    country: "IT",
    isDefault: true,
  });
}
