import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Money } from "@/components/ui";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireOwnCustomer } from "@/server/guard";

export const instant = false;

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="p-8">Caricamento…</main>}>
      <AccountBody />
    </Suspense>
  );
}

async function AccountBody() {
  await connection();
  await connection();
  const { profile } = await requireOwnCustomer();
  const rows = await getDb().select().from(orders).where(eq(orders.customerId, profile.id)).orderBy(desc(orders.createdAt));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Ciao {profile.firstName}</h1>
      <p>Qui trovi ordini, scadenze e consensi. I parametri delle lenti restano in negozio e non li ripetiamo nelle email.</p>
      <ul className="grid gap-2">
        <li><Link href="/area-personale/scadenze">Scadenze</Link></li>
        <li><Link href="/area-personale/privacy">Privacy e consensi</Link></li>
      </ul>
      <h2>Ordini</h2>
      {rows.length === 0 ? <p>Non hai ancora ordini.</p> : null}
      <ul>
        {rows.map((order) => (
          <li key={order.id}>
            <Link href={`/area-personale/ordini/${order.id}`}>{order.publicNumber}</Link>
            {" · "}{order.paymentStatus === "DUE_AT_PICKUP" ? "Da pagare al ritiro" : order.paymentStatus === "PAID" ? "Pagato" : order.paymentStatus}
            {" · "}<Money cents={order.totalCents} />
          </li>
        ))}
      </ul>
    </main>
  );
}
