import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditLogs,
  inventoryMovements,
  orderStatusHistory,
  orders,
  orderItems,
  paymentMovements,
  payments,
  products,
  stripeEvents,
  subscriptionDeliveries,
  subscriptionItems,
  subscriptions,
} from "@/db/schema";
import { canTransitionOrder, canTransitionPayment } from "@/domain/order-state";
import { webhookClaimDecision } from "@/domain/collections";
import { getServerEnv, stripeConfigured } from "@/lib/env";

const API_VERSION = "2026-09-30.endive";

export function getStripe() {
  const key = getServerEnv().STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Il pagamento online non è configurato. Puoi scegliere di pagare in negozio al ritiro.");
  }
  return new Stripe(key, { apiVersion: API_VERSION });
}

export function verifyStripeEvent(rawBody: string, signature: string, secret: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: API_VERSION,
  });
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function startOnlineCheckout(orderId: string, email: string) {
  if (!stripeConfigured()) {
    throw new Error("Il pagamento online non è configurato. Puoi scegliere di pagare in negozio al ritiro.");
  }
  const rows = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) throw new Error("Ordine non trovato.");
  if (order.settlement !== "ONLINE" || order.paymentStatus === "PAID") {
    throw new Error("Questo ordine non è in attesa di un pagamento online.");
  }
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    success_url: `${appUrl}/area-personale/ordini/${order.id}?esito=online`,
    cancel_url: `${appUrl}/checkout?annullato=1`,
    metadata: { orderId: order.id, kind: "order" },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: order.totalCents,
          product_data: { name: `Ordine ${order.publicNumber} — Ottica Montinaro` },
        },
      },
    ],
  });
  await getDb()
    .update(orders)
    .set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() })
    .where(eq(orders.id, order.id));
  if (!session.url) throw new Error("Stripe non ha restituito l'indirizzo di pagamento.");
  return session.url;
}

export async function startSubscriptionCheckout(input: {
  userId: string;
  customerId: string;
  email: string;
  intervalDays: number;
  fulfillment: "PICKUP" | "SHIPPING";
  items: Array<{ productId: string; eye: "RIGHT" | "LEFT"; quantity: number; name: string; priceCents: number }>;
}) {
  if (!stripeConfigured()) throw new Error("Gli abbonamenti online non sono configurati.");
  const active = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.customerId, input.customerId));
  const blocking = active.filter((row) =>
    ["TRIALING", "ACTIVE", "PAST_DUE", "PAUSED", "CANCEL_AT_PERIOD_END"].includes(row.status),
  );
  if (blocking.length > 0) {
    throw new Error("Hai già un abbonamento attivo. Gestiscilo dall'area personale prima di aprirne un altro.");
  }
  const stripe = getStripe();
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    success_url: `${appUrl}/area-personale/abbonamenti?esito=attivo`,
    cancel_url: `${appUrl}/abbonamento`,
    metadata: {
      kind: "subscription",
      userId: input.userId,
      customerId: input.customerId,
      intervalDays: String(input.intervalDays),
      fulfillment: input.fulfillment,
      items: input.items.map((item) => `${item.productId}:${item.eye}:${item.quantity}`).join(","),
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        customerId: input.customerId,
        intervalDays: String(input.intervalDays),
        fulfillment: input.fulfillment,
        items: input.items.map((item) => `${item.productId}:${item.eye}:${item.quantity}`).join(","),
      },
    },
    line_items: input.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: item.priceCents,
        product_data: { name: `${item.name} — occhio ${item.eye === "RIGHT" ? "destro" : "sinistro"}` },
        recurring: { interval: "day", interval_count: input.intervalDays },
      },
    })),
  });
  if (!session.url) throw new Error("Stripe non ha restituito l'indirizzo di pagamento.");
  return session.url;
}

export async function openBillingPortal(stripeCustomerId: string) {
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/area-personale/abbonamenti`,
  });
  return session.url;
}

export async function applyStripeEvent(event: Stripe.Event) {
  const inserted = await getDb()
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning();
  if (webhookClaimDecision(inserted.length > 0) === "skip") return { duplicate: true };
  try {
    await dispatchStripeEvent(event);
    return { duplicate: false };
  } catch (error) {
    await getDb().delete(stripeEvents).where(eq(stripeEvents.id, event.id));
    throw error;
  }
}

async function dispatchStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object);
      return;
    case "payment_intent.succeeded":
      return;
    case "payment_intent.payment_failed":
      await markPaymentFailed(event.data.object.metadata?.orderId);
      return;
    case "invoice.paid":
      await onInvoicePaid(event.data.object);
      return;
    case "invoice.payment_failed":
      await markSubscriptionStatus(customerFromInvoice(event.data.object), "PAST_DUE");
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object);
      return;
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      return;
    case "charge.refunded":
      await onChargeRefunded(event.data.object);
      return;
    default:
      return;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === "subscription") return;
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return;
  const rows = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order || order.paymentStatus === "PAID") return;
  const paymentStep = canTransitionPayment(order.paymentStatus, "PAID");
  const orderStep = canTransitionOrder(order.status, "PAID");
  if (!paymentStep.ok || !orderStep.ok) return;
  const nextStatus = order.requiresPrescriptionReview ? "PENDING_PRESCRIPTION_REVIEW" : "CONFIRMED";
  await getDb().transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        orderId: order.id,
        origin: "STRIPE",
        method: "STRIPE_CARD_ONLINE",
        status: "PAID",
        amountCents: order.totalCents,
        externalRef: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
        idempotencyKey: `stripe:${session.id}`,
      })
      .returning();
    if (payment) {
      await tx.insert(paymentMovements).values({
        paymentId: payment.id,
        orderId: order.id,
        type: "CHARGE",
        amountCents: order.totalCents,
        externalRef: session.id,
        reason: "Pagamento online Stripe",
      });
    }
    await tx
      .update(orders)
      .set({
        status: "PAID",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE_CARD_ONLINE",
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: "PAID",
      fromPaymentStatus: order.paymentStatus,
      toPaymentStatus: "PAID",
      note: "Confermato da Stripe",
    });
    if (canTransitionOrder("PAID", nextStatus).ok) {
      await tx.update(orders).set({ status: nextStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: "PAID",
        toStatus: nextStatus,
        fromPaymentStatus: "PAID",
        toPaymentStatus: "PAID",
        note: nextStatus === "PENDING_PRESCRIPTION_REVIEW" ? "In attesa di verifica" : "Confermato",
      });
    }
    const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const line of lines) {
      if (!line.productId) continue;
      await tx
        .update(products)
        .set({
          stockQty: sql`case when ${products.stockQty} is null then null else greatest(${products.stockQty} - ${line.quantity}, 0) end`,
        })
        .where(eq(products.id, line.productId));
      await tx.insert(inventoryMovements).values({
        productId: line.productId,
        delta: -line.quantity,
        reason: "SALE",
        orderId: order.id,
        note: "Scarico dopo pagamento Stripe",
      });
    }
    await tx.insert(auditLogs).values({
      action: "stripe.paid",
      entity: "order",
      entityId: order.id,
      metadata: { session: session.id },
    });
  });
}

async function markPaymentFailed(orderId: string | undefined) {
  if (!orderId) return;
  const rows = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order || !canTransitionPayment(order.paymentStatus, "FAILED").ok) return;
  await getDb().update(orders).set({ paymentStatus: "FAILED", updatedAt: new Date() }).where(eq(orders.id, order.id));
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const rows = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);
  const subscription = rows[0];
  if (!subscription) return;
  if (subscription.fulfillmentHoldReason) return;
  await getDb().insert(subscriptionDeliveries).values({
    subscriptionId: subscription.id,
    scheduledOn: subscription.nextDeliveryOn ?? new Date().toISOString().slice(0, 10),
    status: "PAID",
    note: invoice.id,
  });
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.metadata?.customerId;
  if (!customerId) return;
  const status = mapSubscriptionStatus(subscription);
  const existing = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);
  const intervalDays = Number(subscription.metadata?.intervalDays ?? 30);
  const fulfillment = subscription.metadata?.fulfillment === "SHIPPING" ? "SHIPPING" : "PICKUP";
  if (!existing[0]) {
    const [created] = await getDb()
      .insert(subscriptions)
      .values({
        customerId,
        userId: subscription.metadata?.userId ?? null,
        status,
        intervalDays,
        fulfillment,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
        nextDeliveryOn: periodEnd(subscription).toISOString().slice(0, 10),
        currentPeriodEnd: periodEnd(subscription),
      })
      .returning();
    if (created) {
      const parts = (subscription.metadata?.items ?? "").split(",").filter(Boolean);
      for (const part of parts) {
        const [productId, eye, quantity] = part.split(":");
        if (!productId || (eye !== "RIGHT" && eye !== "LEFT")) continue;
        await getDb().insert(subscriptionItems).values({
          subscriptionId: created.id,
          productId,
          eye,
          quantity: Number(quantity) || 1,
        });
      }
    }
    return;
  }
  await getDb()
    .update(subscriptions)
    .set({
      status,
      currentPeriodEnd: periodEnd(subscription),
      nextDeliveryOn: periodEnd(subscription).toISOString().slice(0, 10),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing[0].id));
}

function periodEnd(subscription: Stripe.Subscription) {
  const end = subscription.items.data[0]?.current_period_end ?? subscription.billing_cycle_anchor;
  return new Date(end * 1000);
}

function mapSubscriptionStatus(subscription: Stripe.Subscription) {
  if (subscription.cancel_at_period_end && subscription.status === "active") return "CANCEL_AT_PERIOD_END" as const;
  if (subscription.status === "trialing") return "TRIALING" as const;
  if (subscription.status === "past_due" || subscription.status === "unpaid") return "PAST_DUE" as const;
  if (subscription.status === "paused") return "PAUSED" as const;
  if (subscription.status === "canceled" || subscription.status === "incomplete_expired") return "CANCELLED" as const;
  return "ACTIVE" as const;
}

async function markSubscriptionStatus(stripeSubscriptionId: string | null, status: "PAST_DUE") {
  if (!stripeSubscriptionId) return;
  await getDb()
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

function customerFromInvoice(invoice: Stripe.Invoice) {
  return invoiceSubscriptionId(invoice);
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details") {
    const sub = parent.subscription_details?.subscription;
    return typeof sub === "string" ? sub : sub?.id ?? null;
  }
  return null;
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!paymentIntent) return;
  const rows = await getDb().select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntent)).limit(1);
  const order = rows[0];
  if (!order || !canTransitionPayment(order.paymentStatus, "REFUNDED").ok) return;
  const paymentRows = await getDb().select().from(payments).where(eq(payments.orderId, order.id));
  const payment = paymentRows[0];
  if (!payment) return;
  await getDb().insert(paymentMovements).values({
    paymentId: payment.id,
    orderId: order.id,
    type: "REFUND",
    amountCents: charge.amount_refunded,
    externalRef: charge.id,
    reason: "Rimborso Stripe",
  });
  await getDb().update(payments).set({ status: "REFUNDED" }).where(eq(payments.id, payment.id));
  if (canTransitionOrder(order.status, "REFUNDED").ok) {
    await getDb().update(orders).set({ status: "REFUNDED", paymentStatus: "REFUNDED", updatedAt: new Date() }).where(eq(orders.id, order.id));
  }
}
