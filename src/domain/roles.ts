export const ROLES = ["ADMIN", "OPERATOR", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export type StaffAction =
  | "settings"
  | "staff"
  | "audit"
  | "catalog"
  | "customers"
  | "orders"
  | "inStorePayment"
  | "prescriptions"
  | "deadlines"
  | "subscriptions"
  | "privacyAdmin"
  | "overrideUnpaidDelivery"
  | "manualOtherPayment";

const OPERATOR_ACTIONS = new Set<StaffAction>([
  "catalog",
  "customers",
  "orders",
  "inStorePayment",
  "prescriptions",
  "deadlines",
  "subscriptions",
]);

export function canPerform(role: Role, action: StaffAction): boolean {
  if (role === "ADMIN") return true;
  if (role === "OPERATOR") return OPERATOR_ACTIONS.has(action);
  return false;
}

export function assertCan(role: Role, action: StaffAction): void {
  if (!canPerform(role, action)) {
    throw new Error("Non hai l'autorizzazione per questa operazione.");
  }
}

export function canAccessRecord(input: {
  role: Role;
  actorUserId: string;
  ownerUserId: string | null;
}): boolean {
  if (input.role === "ADMIN" || input.role === "OPERATOR") return true;
  return input.ownerUserId != null && input.ownerUserId === input.actorUserId;
}
