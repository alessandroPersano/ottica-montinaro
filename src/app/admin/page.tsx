export const instant = false;

import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { deadlines, orders, prescriptions } from "@/db/schema";
import { Panel } from "@/components/ui";

export default async function AdminHome() {
  await connection();
  const due = await getDb().select().from(orders).where(eq(orders.paymentStatus, "DUE_AT_PICKUP"));
  const pendingRx = await getDb().select().from(prescriptions).where(eq(prescriptions.status, "PENDING_REVIEW"));
  const today = await getDb().select().from(deadlines).where(eq(deadlines.status, "TODAY"));
  const recent = await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(5);
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Panel><h2>Da incassare al ritiro</h2><p className="text-3xl">{due.length}</p></Panel>
        <Panel><h2>Configurazioni da verificare</h2><p className="text-3xl">{pendingRx.length}</p></Panel>
        <Panel><h2>Scadenze oggi</h2><p className="text-3xl">{today.length}</p></Panel>
      </div>
      <h2>Ultimi ordini</h2>
      <ul>{recent.map((order) => <li key={order.id}>{order.publicNumber} · {order.status} · {order.paymentStatus}</li>)}</ul>
    </div>
  );
}
