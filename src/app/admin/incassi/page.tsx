export const instant = false;

import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { payments } from "@/db/schema";
import { Money, Panel } from "@/components/ui";

export default async function InStorePage() {
  await connection();
  const rows = await getDb().select().from(payments).where(eq(payments.origin, "IN_STORE")).orderBy(desc(payments.createdAt)).limit(100);
  const cash = rows.filter((row) => row.method === "CASH_AT_PICKUP" && row.status === "PAID").reduce((sum, row) => sum + row.amountCents, 0);
  const card = rows.filter((row) => row.method === "CARD_AT_PICKUP" && row.status === "PAID").reduce((sum, row) => sum + row.amountCents, 0);
  return (
    <div>
      <h1>Incassi in negozio</h1>
      <Panel>
        <p>Questa vista non sostituisce il registratore telematico, il POS o la contabilità fiscale.</p>
        <p>Contanti registrati: <Money cents={cash} /></p>
        <p>Carta / POS registrati: <Money cents={card} /></p>
      </Panel>
      <ul>{rows.map((row) => <li key={row.id}>{row.method} · {row.status} · <Money cents={row.amountCents} /> · {row.externalRef ?? "senza riferimento"}</li>)}</ul>
    </div>
  );
}
