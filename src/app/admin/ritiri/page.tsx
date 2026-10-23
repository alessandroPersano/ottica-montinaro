export const instant = false;

import Link from "next/link";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Money } from "@/components/ui";

export default async function PickupsPage() {
  await connection();
  const rows = await getDb().select().from(orders).where(eq(orders.paymentStatus, "DUE_AT_PICKUP"));
  return (
    <div>
      <h1>Ritiri da incassare</h1>
      <p>Questi ordini non hanno un pagamento Stripe. L&apos;incasso si registra qui, in contanti o con carta del POS.</p>
      <ul>{rows.map((order) => <li key={order.id}><Link href={`/admin/ordini/${order.id}`}>{order.publicNumber}</Link> · <Money cents={order.totalCents} /></li>)}</ul>
      {rows.length === 0 ? <p>Nessun importo dovuto al ritiro.</p> : null}
    </div>
  );
}
