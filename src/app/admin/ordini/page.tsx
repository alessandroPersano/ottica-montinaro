export const instant = false;

import Link from "next/link";
import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Money } from "@/components/ui";

export default async function AdminOrdersPage() {
  await connection();
  const rows = await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
  return (
    <div>
      <h1>Ordini</h1>
      {rows.length === 0 ? <p>Nessun ordine.</p> : null}
      <ul className="grid gap-3">
        {rows.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/ordini/${order.id}`}>{order.publicNumber}</Link>
            {" · "}{order.status}{" · "}{order.paymentStatus}{" · "}<Money cents={order.totalCents} />
          </li>
        ))}
      </ul>
    </div>
  );
}
