import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requestRates } from "@/db/schema";

export async function assertRateLimit(bucket: string, limit: number, windowMs = 60_000) {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await getDb()
    .insert(requestRates)
    .values({ bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [requestRates.bucket, requestRates.windowStart],
      set: { count: sql`${requestRates.count} + 1` },
    })
    .returning({ count: requestRates.count });
  if ((rows[0]?.count ?? 1) > limit) {
    throw new Error("Troppe richieste. Attendi un minuto e riprova.");
  }
}

export function clientKey(prefix: string, requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${prefix}:${forwarded || "locale"}`;
}
