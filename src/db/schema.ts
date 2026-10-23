import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

export const customerStatus = pgEnum("customer_status", ["ACTIVE", "INACTIVE", "ANONYMIZED"]);
export const addressKind = pgEnum("address_kind", ["BILLING", "SHIPPING"]);
export const productStatus = pgEnum("product_status", ["ACTIVE", "DRAFT", "UNAVAILABLE"]);
export const lensType = pgEnum("lens_type", ["DAILY", "BIWEEKLY", "MONTHLY", "RIGID", "OTHER"]);
export const lensGeometry = pgEnum("lens_geometry", ["SPHERICAL", "TORIC", "MULTIFOCAL", "COSMETIC"]);
export const prescriptionStatus = pgEnum("prescription_status", [
  "DRAFT",
  "PENDING_REVIEW",
  "VALIDATED",
  "EXPIRED",
]);
export const eyeSide = pgEnum("eye_side", ["RIGHT", "LEFT"]);
export const purchaseMode = pgEnum("purchase_mode", ["ONE_TIME", "SUBSCRIPTION"]);
export const fulfillmentType = pgEnum("fulfillment_type", ["PICKUP", "SHIPPING"]);
export const settlementType = pgEnum("settlement_type", ["ONLINE", "PAY_AT_PICKUP"]);
export const orderStatus = pgEnum("order_status", [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_DUE_AT_PICKUP",
  "PAID",
  "PENDING_PRESCRIPTION_REVIEW",
  "CONFIRMED",
  "ORDERED_FROM_SUPPLIER",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentStatus = pgEnum("payment_status", [
  "NOT_REQUIRED",
  "PENDING",
  "DUE_AT_PICKUP",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "FAILED",
  "VOIDED",
]);
export const paymentMethod = pgEnum("payment_method", [
  "STRIPE_CARD_ONLINE",
  "CASH_AT_PICKUP",
  "CARD_AT_PICKUP",
  "MANUAL_OTHER",
]);
export const paymentOrigin = pgEnum("payment_origin", ["STRIPE", "IN_STORE", "MANUAL"]);
export const movementType = pgEnum("movement_type", ["CHARGE", "REFUND", "VOID", "ADJUSTMENT"]);
export const receiptMethod = pgEnum("receipt_method", ["CASH", "IN_STORE_CARD"]);
export const reservationStatus = pgEnum("reservation_status", [
  "ACTIVE",
  "EXTENDED",
  "EXPIRED",
  "COLLECTED",
  "CANCELLED",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "PAUSED",
  "CANCEL_AT_PERIOD_END",
  "CANCELLED",
]);
export const deadlineStatus = pgEnum("deadline_status", [
  "FUTURE",
  "APPROACHING",
  "IMMINENT",
  "TODAY",
  "OVERDUE",
  "REORDERED",
  "SUSPENDED",
]);
export const consentSource = pgEnum("consent_source", ["SIGNUP", "CHECKOUT", "PROFILE"]);
export const inventoryReason = pgEnum("inventory_reason", [
  "RECEIPT",
  "SALE",
  "RESERVE",
  "RELEASE",
  "ADJUSTMENT",
  "RETURN",
]);
export const privacyRequestKind = pgEnum("privacy_request_kind", ["RECTIFICATION", "ERASURE", "EXPORT"]);
export const privacyRequestStatus = pgEnum("privacy_request_status", ["OPEN", "DONE", "REJECTED"]);
export const reminderChannel = pgEnum("reminder_channel", ["EMAIL"]);
export const reminderOutcome = pgEnum("reminder_outcome", ["PENDING", "SENT", "FAILED", "SKIPPED"]);

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("CUSTOMER"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: "date" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: "date" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("auth_accounts_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("verification_tokens_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const rateLimit = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    fiscalCode: text("fiscal_code"),
    vatNumber: text("vat_number"),
    contactPreferences: jsonb("contact_preferences").$type<{ email: boolean; phone: boolean }>(),
    status: customerStatus("status").notNull().default("ACTIVE"),
    internalNotes: text("internal_notes"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("customer_profiles_email_idx").on(table.email),
    index("customer_profiles_phone_idx").on(table.phone),
    index("customer_profiles_user_idx").on(table.userId),
  ],
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customerProfiles.id, { onDelete: "cascade" }),
  kind: addressKind("kind").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  country: text("country").notNull().default("IT"),
  isDefault: boolean("is_default").notNull().default(false),
  ...timestamps,
});

export const manufacturers = pgTable("manufacturers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  manufacturerId: uuid("manufacturer_id")
    .notNull()
    .references(() => manufacturers.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    manufacturerId: uuid("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id),
    commercialName: text("commercial_name").notNull(),
    slug: text("slug").notNull().unique(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    lensType: lensType("lens_type").notNull(),
    geometry: lensGeometry("geometry").notNull(),
    material: text("material"),
    waterContent: text("water_content"),
    lensesPerPack: integer("lenses_per_pack").notNull(),
    replacementFrequencyDays: integer("replacement_frequency_days").notNull(),
    sku: text("sku").notNull().unique(),
    barcode: text("barcode"),
    priceCents: integer("price_cents").notNull(),
    compareAtPriceCents: integer("compare_at_price_cents"),
    costCents: integer("cost_cents"),
    vatRateBps: integer("vat_rate_bps").notNull().default(2200),
    stockQty: integer("stock_qty"),
    reorderThreshold: integer("reorder_threshold"),
    status: productStatus("status").notNull().default("DRAFT"),
    allowSinglePurchase: boolean("allow_single_purchase").notNull().default(true),
    allowSubscription: boolean("allow_subscription").notNull().default(false),
    subscriptionIntervals: integer("subscription_intervals").array().notNull().default([]),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isDemo: boolean("is_demo").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("products_status_idx").on(table.status),
    index("products_brand_idx").on(table.brandId),
    index("products_type_idx").on(table.lensType, table.geometry),
  ],
);

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  alt: text("alt").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productParameterRules = pgTable("product_parameter_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: "cascade" }),
  rules: jsonb("rules").notNull(),
  ...timestamps,
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  label: text("label").notNull(),
  barcode: text("barcode"),
  priceCents: integer("price_cents"),
  stockQty: integer("stock_qty"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    delta: integer("delta").notNull(),
    reason: inventoryReason("reason").notNull(),
    orderId: uuid("order_id"),
    note: text("note"),
    actorId: text("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("inventory_movements_product_idx").on(table.productId)],
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customerProfiles.id),
    productId: uuid("product_id").references(() => products.id),
    status: prescriptionStatus("status").notNull().default("DRAFT"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    validatedById: text("validated_by_id").references(() => user.id),
    professionalNotes: text("professional_notes"),
    changeRequest: text("change_request"),
    clinicalConsentVersion: text("clinical_consent_version"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (table) => [index("prescriptions_customer_idx").on(table.customerId, table.status)],
);

export const prescriptionEyes = pgTable(
  "prescription_eyes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescriptions.id, { onDelete: "cascade" }),
    eye: eyeSide("eye").notNull(),
    productId: uuid("product_id").references(() => products.id),
    sphere: text("sphere").notNull(),
    cylinder: text("cylinder"),
    axis: text("axis"),
    addition: text("addition"),
    baseCurve: text("base_curve").notNull(),
    diameter: text("diameter").notNull(),
    dominance: text("dominance"),
    color: text("color"),
  },
  (table) => [uniqueIndex("prescription_eyes_unique").on(table.prescriptionId, table.eye)],
);

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  eye: eyeSide("eye").notNull(),
  quantity: integer("quantity").notNull(),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
  purchaseMode: purchaseMode("purchase_mode").notNull().default("ONE_TIME"),
  intervalDays: integer("interval_days"),
  ...timestamps,
});

export const orderCounters = pgTable("order_counters", {
  year: integer("year").primaryKey(),
  lastValue: integer("last_value").notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicNumber: text("public_number").notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customerProfiles.id),
    userId: text("user_id").references(() => user.id),
    status: orderStatus("status").notNull(),
    paymentStatus: paymentStatus("payment_status").notNull(),
    fulfillment: fulfillmentType("fulfillment").notNull(),
    settlement: settlementType("settlement").notNull(),
    paymentMethod: paymentMethod("payment_method"),
    currency: text("currency").notNull().default("EUR"),
    subtotalCents: integer("subtotal_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
    requiresPrescriptionReview: boolean("requires_prescription_review").notNull().default(false),
    shippingAddressId: uuid("shipping_address_id").references(() => addresses.id),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    subscriptionId: uuid("subscription_id"),
    deliveryOverrideReason: text("delivery_override_reason"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("orders_customer_idx").on(table.customerId),
    index("orders_status_idx").on(table.status, table.paymentStatus),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  eye: eyeSide("eye").notNull(),
  quantity: integer("quantity").notNull(),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  vatRateBps: integer("vat_rate_bps").notNull(),
  prescriptionId: uuid("prescription_id"),
});

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    fromPaymentStatus: paymentStatus("from_payment_status"),
    toPaymentStatus: paymentStatus("to_payment_status"),
    actorId: text("actor_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId, table.createdAt)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    origin: paymentOrigin("origin").notNull(),
    method: paymentMethod("method").notNull(),
    status: paymentStatus("status").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    externalRef: text("external_ref"),
    operatorId: text("operator_id").references(() => user.id),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    uniqueIndex("payments_in_store_once")
      .on(table.orderId)
      .where(
        sql`${table.origin} = 'IN_STORE' AND ${table.status} IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')`,
      ),
  ],
);

export const paymentMovements = pgTable("payment_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  type: movementType("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  reason: text("reason"),
  externalRef: text("external_ref"),
  operatorId: text("operator_id").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const inStorePaymentReceipts = pgTable("in_store_payment_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  movementId: uuid("movement_id")
    .notNull()
    .unique()
    .references(() => paymentMovements.id),
  method: receiptMethod("method").notNull(),
  receiptReference: text("receipt_reference"),
  note: text("note"),
  collectedAt: timestamp("collected_at", { withTimezone: true, mode: "date" }).notNull(),
  operatorId: text("operator_id")
    .notNull()
    .references(() => user.id),
});

export const pickupReservations = pgTable("pickup_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  status: reservationStatus("status").notNull().default("ACTIVE"),
  reservedUntil: timestamp("reserved_until", { withTimezone: true, mode: "date" }).notNull(),
  extensionReason: text("extension_reason"),
  cancelReason: text("cancel_reason"),
  ...timestamps,
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customerProfiles.id),
    userId: text("user_id").references(() => user.id),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
    status: subscriptionStatus("status").notNull(),
    intervalDays: integer("interval_days").notNull(),
    fulfillment: fulfillmentType("fulfillment").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id"),
    nextDeliveryOn: text("next_delivery_on"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "date" }),
    fulfillmentHoldReason: text("fulfillment_hold_reason"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (table) => [index("subscriptions_customer_idx").on(table.customerId, table.status)],
);

export const subscriptionItems = pgTable("subscription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  eye: eyeSide("eye").notNull(),
  quantity: integer("quantity").notNull(),
  stripePriceId: text("stripe_price_id"),
});

export const subscriptionDeliveries = pgTable("subscription_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  orderId: uuid("order_id").references(() => orders.id),
  scheduledOn: text("scheduled_on").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const deadlines = pgTable(
  "deadlines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customerProfiles.id),
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id),
    orderId: uuid("order_id").references(() => orders.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    dueOn: text("due_on").notNull(),
    calculatedDueOn: text("calculated_due_on").notNull(),
    manualReason: text("manual_reason"),
    status: deadlineStatus("status").notNull(),
    supplyDays: integer("supply_days").notNull(),
    eyesCovered: integer("eyes_covered").notNull(),
    suspended: boolean("suspended").notNull().default(false),
    reordered: boolean("reordered").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (table) => [index("deadlines_due_idx").on(table.dueOn, table.status)],
);

export const reminderRules = pgTable("reminder_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  offsetDays: integer("offset_days").notNull(),
  active: boolean("active").notNull().default(true),
  kind: text("kind").notNull().default("DEADLINE"),
  ...timestamps,
});

export const reminderDeliveries = pgTable(
  "reminder_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deadlineId: uuid("deadline_id").references(() => deadlines.id),
    orderId: uuid("order_id").references(() => orders.id),
    ruleId: uuid("rule_id").references(() => reminderRules.id),
    channel: reminderChannel("channel").notNull().default("EMAIL"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    outcome: reminderOutcome("outcome").notNull().default("PENDING"),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("reminder_deliveries_deadline_idx").on(table.deadlineId)],
);

export const privacyDocuments = pgTable(
  "privacy_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentType: text("document_type").notNull(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    contentHash: text("content_hash").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("privacy_documents_type_version").on(table.documentType, table.version)],
);

export const consentEvents = pgTable(
  "consent_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id),
    customerId: uuid("customer_id").references(() => customerProfiles.id),
    documentType: text("document_type").notNull(),
    documentVersion: text("document_version").notNull(),
    accepted: boolean("accepted").notNull(),
    source: consentSource("source").notNull(),
    textHash: text("text_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("consent_events_user_idx").on(table.userId, table.documentType)],
);

export const privacyRequests = pgTable("privacy_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id),
  customerId: uuid("customer_id").references(() => customerProfiles.id),
  kind: privacyRequestKind("kind").notNull(),
  status: privacyRequestStatus("status").notNull().default("OPEN"),
  message: text("message").notNull(),
  resolution: text("resolution"),
  ...timestamps,
});

export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedBy: text("updated_by"),
});

export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").references(() => user.id),
  status: text("status").notNull(),
  summary: jsonb("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const requestRates = pgTable(
  "request_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true, mode: "date" }).notNull(),
    count: integer("count").notNull(),
  },
  (table) => [uniqueIndex("request_rates_bucket_window").on(table.bucket, table.windowStart)],
);
