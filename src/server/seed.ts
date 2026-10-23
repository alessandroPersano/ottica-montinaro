import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  account,
  brands,
  customerProfiles,
  deadlines,
  manufacturers,
  orderItems,
  orders,
  payments,
  paymentMovements,
  pickupReservations,
  prescriptions,
  prescriptionEyes,
  productImages,
  productParameterRules,
  products,
  staffProfiles,
  subscriptions,
  subscriptionItems,
  user,
  inStorePaymentReceipts,
  appSettings,
  privacyDocuments,
} from "@/db/schema";
import { defaultSettings, SETTINGS_KEY } from "@/lib/settings";
import { createHash } from "node:crypto";

export const DEMO_PASSWORD = "Demo-Password-1";

const ids = {
  admin: "11111111-1111-4111-8111-111111111111",
  operator: "22222222-2222-4222-8222-222222222222",
  customer: "33333333-3333-4333-8333-333333333333",
  customer2: "44444444-4444-4444-8444-444444444444",
  maker: "55555555-5555-4555-8555-555555555550",
  brand: "55555555-5555-4555-8555-555555555560",
  daily: "55555555-5555-4555-8555-555555555551",
  toric: "55555555-5555-4555-8555-555555555552",
  multi: "55555555-5555-4555-8555-555555555553",
  profile: "66666666-6666-4666-8666-666666666661",
  profile2: "66666666-6666-4666-8666-666666666662",
  rx: "77777777-7777-4777-8777-777777777771",
  rxPending: "77777777-7777-4777-8777-777777777772",
  orderDue: "88888888-8888-4888-8888-888888888881",
  orderCard: "88888888-8888-4888-8888-888888888882",
  orderExpired: "88888888-8888-4888-8888-888888888883",
  orderDelivered: "88888888-8888-4888-8888-888888888884",
  subActive: "99999999-9999-4999-8999-999999999991",
  subFailed: "99999999-9999-4999-8999-999999999992",
};

export async function seedDemo() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Il seed demo non si esegue in produzione.");
  }
  const database = getDb();
  const password = await hashPassword(DEMO_PASSWORD);
  const orderIds = [ids.orderDue, ids.orderCard, ids.orderExpired, ids.orderDelivered];

  await database.delete(inStorePaymentReceipts).where(inArray(inStorePaymentReceipts.operatorId, [ids.operator, ids.admin]));
  await database.delete(paymentMovements).where(inArray(paymentMovements.orderId, orderIds));
  await database.delete(payments).where(inArray(payments.orderId, orderIds));
  await database.delete(pickupReservations).where(inArray(pickupReservations.orderId, orderIds));
  await database.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
  await database.delete(deadlines).where(inArray(deadlines.orderId, orderIds));
  await database.delete(subscriptionItems).where(inArray(subscriptionItems.subscriptionId, [ids.subActive, ids.subFailed]));
  await database.delete(subscriptions).where(inArray(subscriptions.id, [ids.subActive, ids.subFailed]));
  await database.delete(orders).where(inArray(orders.id, orderIds));
  await database.delete(prescriptionEyes).where(inArray(prescriptionEyes.prescriptionId, [ids.rx, ids.rxPending]));
  await database.delete(prescriptions).where(inArray(prescriptions.id, [ids.rx, ids.rxPending]));
  await database.delete(productImages).where(inArray(productImages.productId, [ids.daily, ids.toric, ids.multi]));
  await database.delete(productParameterRules).where(inArray(productParameterRules.productId, [ids.daily, ids.toric, ids.multi]));
  await database.delete(products).where(inArray(products.id, [ids.daily, ids.toric, ids.multi]));
  await database.delete(brands).where(eq(brands.id, ids.brand));
  await database.delete(manufacturers).where(eq(manufacturers.id, ids.maker));
  await database.delete(customerProfiles).where(inArray(customerProfiles.id, [ids.profile, ids.profile2]));
  await database.delete(staffProfiles).where(inArray(staffProfiles.userId, [ids.admin, ids.operator]));
  await database.delete(account).where(inArray(account.userId, [ids.admin, ids.operator, ids.customer, ids.customer2]));
  await database.delete(user).where(inArray(user.id, [ids.admin, ids.operator, ids.customer, ids.customer2]));

  await database.insert(user).values([
    { id: ids.admin, name: "Ada Admin Demo", email: "demo.admin@example.com", emailVerified: true, role: "ADMIN" },
    { id: ids.operator, name: "Neri Operatore Demo", email: "demo.operatore@example.com", emailVerified: true, role: "OPERATOR" },
    { id: ids.customer, name: "Chiara Cliente Demo", email: "demo.cliente@example.com", emailVerified: true, role: "CUSTOMER" },
    { id: ids.customer2, name: "Leo Cliente Demo", email: "demo.cliente2@example.com", emailVerified: true, role: "CUSTOMER" },
  ]);
  for (const userId of [ids.admin, ids.operator, ids.customer, ids.customer2]) {
    await database.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });
  }
  await database.insert(staffProfiles).values([
    { userId: ids.admin },
    { userId: ids.operator },
  ]);
  await database.insert(customerProfiles).values([
    { id: ids.profile, userId: ids.customer, firstName: "Chiara", lastName: "Cliente Demo", email: "demo.cliente@example.com", phone: "3330000001", isDemo: true },
    { id: ids.profile2, userId: ids.customer2, firstName: "Leo", lastName: "Cliente Demo", email: "demo.cliente2@example.com", phone: "3330000002", isDemo: true },
  ]);
  await database.insert(manufacturers).values({ id: ids.maker, name: "Lumen Laboratori Demo", slug: "lumen-demo" });
  await database.insert(brands).values({ id: ids.brand, manufacturerId: ids.maker, name: "Lumen Demo", slug: "lumen-demo" });

  const spherical = {
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
  await database.insert(products).values([
    product(ids.daily, "Lumen Giorno Demo", "lumen-giorno-demo", "DAILY", "SPHERICAL", 30, 1, 1890, "SKU-DEMO-DAY", true),
    product(ids.toric, "Lumen Torica Demo", "lumen-torica-demo", "MONTHLY", "TORIC", 6, 30, 3290, "SKU-DEMO-TOR", true),
    product(ids.multi, "Lumen Multi Demo", "lumen-multi-demo", "MONTHLY", "MULTIFOCAL", 6, 30, 3690, "SKU-DEMO-MUL", false),
  ]);
  await database.insert(productParameterRules).values([
    { productId: ids.daily, rules: spherical },
    { productId: ids.toric, rules: { ...spherical, geometry: "TORIC", cylinderMin: -2.25, cylinderMax: -0.75, cylinderStep: 0.25, axisMin: 10, axisMax: 180, axisStep: 10 } },
    { productId: ids.multi, rules: { ...spherical, geometry: "MULTIFOCAL", additionOptions: ["+1.00", "+1.50", "+2.00"] } },
  ]);
  await database.insert(productImages).values([
    { productId: ids.daily, path: "/images/products/giornaliera.svg", alt: "Illustrazione astratta di una lente giornaliera", sortOrder: 0 },
    { productId: ids.toric, path: "/images/products/torica.svg", alt: "Illustrazione astratta di una lente torica", sortOrder: 0 },
    { productId: ids.multi, path: "/images/products/multifocale.svg", alt: "Illustrazione astratta di una lente multifocale", sortOrder: 0 },
  ]);
  await database.insert(prescriptions).values([
    { id: ids.rx, customerId: ids.profile, productId: ids.daily, status: "VALIDATED", validatedById: ids.operator, lastVerifiedAt: new Date("2026-09-01"), expiresAt: new Date("2027-09-01"), isDemo: true },
    { id: ids.rxPending, customerId: ids.profile2, productId: ids.toric, status: "PENDING_REVIEW", isDemo: true },
  ]);
  await database.insert(prescriptionEyes).values([
    { prescriptionId: ids.rx, eye: "RIGHT", productId: ids.daily, sphere: "-1.25", baseCurve: "8.6", diameter: "14.2" },
    { prescriptionId: ids.rx, eye: "LEFT", productId: ids.daily, sphere: "-1.50", baseCurve: "8.6", diameter: "14.2" },
    { prescriptionId: ids.rxPending, eye: "RIGHT", productId: ids.toric, sphere: "-2.00", cylinder: "-1.25", axis: "180", baseCurve: "8.6", diameter: "14.2" },
  ]);

  await database.insert(orders).values([
    order(ids.orderDue, "OM-DEMO-00001", "PAYMENT_DUE_AT_PICKUP", "DUE_AT_PICKUP", null, 1890),
    order(ids.orderCard, "OM-DEMO-00002", "READY_FOR_PICKUP", "PAID", "CARD_AT_PICKUP", 3290),
    order(ids.orderExpired, "OM-DEMO-00003", "PAYMENT_DUE_AT_PICKUP", "DUE_AT_PICKUP", null, 1890),
    order(ids.orderDelivered, "OM-DEMO-00004", "DELIVERED", "PAID", "CASH_AT_PICKUP", 1890),
  ]);
  await database.insert(orderItems).values([
    { orderId: ids.orderDue, productId: ids.daily, eye: "RIGHT", quantity: 1, productName: "Lumen Giorno Demo", sku: "SKU-DEMO-DAY", unitPriceCents: 1890, vatRateBps: 2200 },
    { orderId: ids.orderCard, productId: ids.toric, eye: "RIGHT", quantity: 1, productName: "Lumen Torica Demo", sku: "SKU-DEMO-TOR", unitPriceCents: 3290, vatRateBps: 2200 },
    { orderId: ids.orderExpired, productId: ids.daily, eye: "LEFT", quantity: 1, productName: "Lumen Giorno Demo", sku: "SKU-DEMO-DAY", unitPriceCents: 1890, vatRateBps: 2200 },
    { orderId: ids.orderDelivered, productId: ids.daily, eye: "RIGHT", quantity: 1, productName: "Lumen Giorno Demo", sku: "SKU-DEMO-DAY", unitPriceCents: 1890, vatRateBps: 2200 },
  ]);
  await database.insert(pickupReservations).values([
    { orderId: ids.orderDue, status: "ACTIVE", reservedUntil: new Date("2026-10-30T20:00:00.000Z") },
    { orderId: ids.orderExpired, status: "EXPIRED", reservedUntil: new Date("2026-10-01T20:00:00.000Z") },
  ]);
  const [cardPayment] = await database.insert(payments).values({
    orderId: ids.orderCard,
    origin: "IN_STORE",
    method: "CARD_AT_PICKUP",
    status: "PAID",
    amountCents: 3290,
    operatorId: ids.operator,
    idempotencyKey: "demo-pos-00002",
    externalRef: "POS-DEMO-88",
  }).returning();
  if (cardPayment) {
    const [movement] = await database.insert(paymentMovements).values({
      paymentId: cardPayment.id,
      orderId: ids.orderCard,
      type: "CHARGE",
      amountCents: 3290,
      operatorId: ids.operator,
      reason: "Incasso demo carta/POS",
    }).returning();
    if (movement) {
      await database.insert(inStorePaymentReceipts).values({
        movementId: movement.id,
        method: "IN_STORE_CARD",
        receiptReference: "POS-DEMO-88",
        collectedAt: new Date("2026-10-20T10:00:00.000Z"),
        operatorId: ids.operator,
      });
    }
  }
  await database.insert(deadlines).values([
    { customerId: ids.profile, orderId: ids.orderDelivered, dueOn: "2026-10-01", calculatedDueOn: "2026-10-01", status: "OVERDUE", supplyDays: 30, eyesCovered: 1, isDemo: true },
    { customerId: ids.profile, orderId: ids.orderCard, dueOn: "2026-11-20", calculatedDueOn: "2026-11-20", status: "FUTURE", supplyDays: 30, eyesCovered: 1, isDemo: true },
  ]);
  await database.insert(subscriptions).values([
    { id: ids.subActive, customerId: ids.profile, userId: ids.customer, prescriptionId: ids.rx, status: "ACTIVE", intervalDays: 30, fulfillment: "PICKUP", stripeSubscriptionId: "sub_demo_active", nextDeliveryOn: "2026-11-15", isDemo: true },
    { id: ids.subFailed, customerId: ids.profile2, userId: ids.customer2, status: "PAST_DUE", intervalDays: 60, fulfillment: "SHIPPING", stripeSubscriptionId: "sub_demo_past_due", nextDeliveryOn: "2026-11-02", isDemo: true },
  ]);
  await database.insert(subscriptionItems).values([
    { subscriptionId: ids.subActive, productId: ids.daily, eye: "RIGHT", quantity: 1 },
    { subscriptionId: ids.subActive, productId: ids.daily, eye: "LEFT", quantity: 1 },
    { subscriptionId: ids.subFailed, productId: ids.toric, eye: "RIGHT", quantity: 1 },
  ]);
  const privacyBody = "BOZZA da revisionare da un professionista prima della produzione. Questa informativa non è un testo legale definitivo.";
  await database.insert(privacyDocuments).values({
    documentType: "PRIVACY",
    version: "2026-10-bozza",
    title: "Informativa privacy",
    body: privacyBody,
    contentHash: createHash("sha256").update(privacyBody).digest("hex"),
    isCurrent: true,
  }).onConflictDoNothing();
  await database.insert(appSettings).values({ key: SETTINGS_KEY, value: defaultSettings }).onConflictDoNothing();
}

function product(id: string, name: string, slug: string, lensType: "DAILY" | "MONTHLY", geometry: "SPHERICAL" | "TORIC" | "MULTIFOCAL", lenses: number, days: number, price: number, sku: string, subscription: boolean) {
  return {
    id,
    manufacturerId: ids.maker,
    brandId: ids.brand,
    commercialName: name,
    slug,
    shortDescription: "Prodotto dimostrativo, non in commercio.",
    description: "Lente fittizia usata solo per provare catalogo, ordini e scadenze. Non corrisponde a un dispositivo reale.",
    lensType,
    geometry,
    lensesPerPack: lenses,
    replacementFrequencyDays: days,
    sku,
    priceCents: price,
    vatRateBps: 2200,
    stockQty: 40,
    status: "ACTIVE" as const,
    allowSinglePurchase: true,
    allowSubscription: subscription,
    subscriptionIntervals: subscription ? [30, 60, 90] : [],
    isDemo: true,
  };
}

function order(id: string, publicNumber: string, status: "PAYMENT_DUE_AT_PICKUP" | "READY_FOR_PICKUP" | "DELIVERED", paymentStatus: "DUE_AT_PICKUP" | "PAID", method: "CARD_AT_PICKUP" | "CASH_AT_PICKUP" | null, total: number) {
  return {
    id,
    publicNumber,
    customerId: ids.profile,
    userId: ids.customer,
    status,
    paymentStatus,
    fulfillment: "PICKUP" as const,
    settlement: paymentStatus === "DUE_AT_PICKUP" ? "PAY_AT_PICKUP" as const : "ONLINE" as const,
    paymentMethod: method,
    subtotalCents: total,
    vatCents: Math.round(total - (total * 10000) / 12200),
    shippingCents: 0,
    totalCents: total,
    isDemo: true,
  };
}
