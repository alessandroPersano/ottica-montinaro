export const instant = false;

import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { deadlines } from "@/db/schema";
import { requireOwnCustomer } from "@/server/guard";

export default async function MyDeadlinesPage() {
  await connection();
  const { profile } = await requireOwnCustomer();
  const rows = await getDb().select().from(deadlines).where(eq(deadlines.customerId, profile.id));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Scadenze</h1>
      {rows.length === 0 ? <p>Non ci sono scadenze collegate al tuo profilo.</p> : null}
      <ul>{rows.map((row) => <li key={row.id}>{row.dueOn} · {label(row.status)}</li>)}</ul>
    </main>
  );
}

function label(status: string) {
  const map: Record<string, string> = {
    FUTURE: "futura",
    APPROACHING: "in avvicinamento",
    IMMINENT: "imminente",
    TODAY: "oggi",
    OVERDUE: "scaduta",
    REORDERED: "riordinata",
    SUSPENDED: "sospesa",
  };
  return map[status] ?? status;
}
