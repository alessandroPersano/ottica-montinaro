export const instant = false;

import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Money, Panel } from "@/components/ui";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireOwnCustomer } from "@/server/guard";

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const { profile } = await requireOwnCustomer();
  const rows = await getDb().select().from(orders).where(and(eq(orders.id, id), eq(orders.customerId, profile.id))).limit(1);
  const order = rows[0];
  if (!order) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Ordine {order.publicNumber}</h1>
      <Panel>
        <p>{order.paymentStatus === "DUE_AT_PICKUP" ? "Non è stato pagato online. Potrai pagare in negozio in contanti o con carta." : order.paymentStatus === "PAID" ? "Pagato." : "Pagamento in corso o non riuscito."}</p>
        <p>Totale <Money cents={order.totalCents} /></p>
        <p>Stato: {order.status}</p>
      </Panel>
    </main>
  );
}
