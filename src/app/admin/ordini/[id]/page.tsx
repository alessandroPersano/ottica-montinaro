export const instant = false;

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { OrderActions } from "@/components/order-actions";
import { Money, Panel } from "@/components/ui";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const rows = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) notFound();
  const due = order.paymentStatus === "DUE_AT_PICKUP";
  return (
    <div>
      <h1>{order.publicNumber}</h1>
      <Panel>
        <p>Stato ordine: {order.status}</p>
        <p>Pagamento: {order.paymentStatus}{order.paymentMethod ? ` · ${order.paymentMethod}` : ""}</p>
        <p>{due ? "Da pagare al ritiro" : order.paymentStatus === "PAID" ? "Pagato" : "Pagamento non completato"} · <Money cents={order.totalCents} /></p>
      </Panel>
      <OrderActions orderId={order.id} amountCents={order.totalCents} due={due} />
    </div>
  );
}
