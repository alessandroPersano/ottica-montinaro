export const ORDER_STATUSES = [
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
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "DUE_AT_PICKUP",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "FAILED",
  "VOIDED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: ["PENDING_PAYMENT", "PAYMENT_DUE_AT_PICKUP", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAYMENT_DUE_AT_PICKUP: ["PAID", "CANCELLED"],
  PAID: ["PENDING_PRESCRIPTION_REVIEW", "CONFIRMED", "REFUNDED", "CANCELLED"],
  PENDING_PRESCRIPTION_REVIEW: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["ORDERED_FROM_SUPPLIER", "READY_FOR_PICKUP", "SHIPPED", "REFUNDED", "CANCELLED"],
  ORDERED_FROM_SUPPLIER: ["READY_FOR_PICKUP", "SHIPPED", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "REFUNDED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  NOT_REQUIRED: [],
  PENDING: ["PAID", "FAILED", "VOIDED"],
  DUE_AT_PICKUP: ["PAID", "VOIDED"],
  PAID: ["PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  REFUNDED: [],
  FAILED: ["PENDING", "VOIDED"],
  VOIDED: [],
};

export type TransitionDecision =
  | { ok: true }
  | { ok: false; message: string };

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): TransitionDecision {
  if (from === to) {
    return { ok: false, message: "L'ordine è già in questo stato." };
  }
  if (!ORDER_TRANSITIONS[from].includes(to)) {
    return {
      ok: false,
      message: `Non si può passare da ${from} a ${to}.`,
    };
  }
  return { ok: true };
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): TransitionDecision {
  if (from === to) {
    return { ok: false, message: "Il pagamento è già in questo stato." };
  }
  if (!PAYMENT_TRANSITIONS[from].includes(to)) {
    return {
      ok: false,
      message: `Non si può passare da ${from} a ${to}.`,
    };
  }
  return { ok: true };
}

const FULFILLMENT_STATES = new Set<OrderStatus>(["READY_FOR_PICKUP", "SHIPPED", "DELIVERED"]);

export function canMarkDelivered(input: {
  from: OrderStatus;
  paymentStatus: PaymentStatus;
  actorRole: "ADMIN" | "OPERATOR" | "CUSTOMER";
  adminOverrideReason?: string | null;
}): TransitionDecision {
  const transition = canTransitionOrder(input.from, "DELIVERED");
  if (!transition.ok) return transition;

  const settled =
    input.paymentStatus === "PAID" ||
    input.paymentStatus === "NOT_REQUIRED" ||
    input.paymentStatus === "PARTIALLY_REFUNDED";

  if (settled) return { ok: true };

  const reason = input.adminOverrideReason?.trim() ?? "";
  if (input.actorRole === "ADMIN" && reason.length >= 8) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "Non puoi consegnare l'ordine: il saldo è ancora dovuto.",
  };
}

export function isFulfillmentState(status: OrderStatus): boolean {
  return FULFILLMENT_STATES.has(status);
}
