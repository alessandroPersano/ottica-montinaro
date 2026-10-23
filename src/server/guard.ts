import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerProfiles } from "@/db/schema";
import { assertCan, canAccessRecord, type Role, type StaffAction } from "@/domain/roles";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requirePageUser() {
  const session = await getSession();
  if (!session) redirect("/accesso");
  return session;
}

export async function requireActionUser() {
  const session = await getSession();
  if (!session) throw new Error("Devi accedere per continuare.");
  return session;
}

export function roleOf(session: { user: { role?: string | null } }): Role {
  if (session.user.role === "ADMIN" || session.user.role === "OPERATOR") return session.user.role;
  return "CUSTOMER";
}

export async function requireStaffPage(action: StaffAction) {
  const session = await requirePageUser();
  const role = roleOf(session);
  if (!canAccessStaff(role, action)) redirect("/area-personale");
  return { session, role, userId: session.user.id };
}

export async function requireStaffAction(action: StaffAction) {
  const session = await requireActionUser();
  const role = roleOf(session);
  assertCan(role, action);
  return { session, role, userId: session.user.id };
}

function canAccessStaff(role: Role, action: StaffAction) {
  try {
    assertCan(role, action);
    return true;
  } catch {
    return false;
  }
}

export async function customerForUser(userId: string) {
  const rows = await getDb().select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function requireOwnCustomer() {
  const session = await requirePageUser();
  const profile = await customerForUser(session.user.id);
  if (!profile) redirect("/accesso");
  return { session, profile, role: roleOf(session) };
}

export function assertRecordAccess(role: Role, actorUserId: string, ownerUserId: string | null) {
  if (!canAccessRecord({ role, actorUserId, ownerUserId })) {
    throw new Error("Non hai l'autorizzazione per questi dati.");
  }
}
