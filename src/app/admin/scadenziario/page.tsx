export const instant = false;

import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { deadlines } from "@/db/schema";

export default async function DeadlinesPage() {
  await connection();
  const rows = await getDb().select().from(deadlines).orderBy(asc(deadlines.dueOn)).limit(100);
  return (
    <div>
      <h1>Scadenziario</h1>
      <ul>{rows.map((row) => <li key={row.id}>{row.dueOn} · {row.status}</li>)}</ul>
      {rows.length === 0 ? <p>Nessuna scadenza.</p> : null}
    </div>
  );
}
