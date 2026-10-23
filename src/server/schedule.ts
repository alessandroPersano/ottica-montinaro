import { and, eq, lt, sql } from "drizzle-orm";
import { classifyDeadline, deadlineDiffDays } from "@/domain/deadlines";
import { reminderIdempotencyKey, reminderIsDue } from "@/domain/reminders";
import { romeDateKey } from "@/domain/time";
import { getDb } from "@/db";
import {
  customerProfiles,
  deadlines,
  pickupReservations,
  prescriptions,
  reminderDeliveries,
  subscriptions,
} from "@/db/schema";
import { renderServiceEmail, sendTransactionalEmail } from "@/server/email";
import { getSettings } from "@/server/settings";

export async function runDailyJobs() {
  const settings = await getSettings();
  const rows = await getDb().select().from(deadlines).limit(200);
  let sent = 0;
  let failed = 0;
  const today = new Date();
  for (const deadline of rows) {
    const diff = deadlineDiffDays(deadline.dueOn, today);
    const status = classifyDeadline(
      diff,
      { reordered: deadline.reordered, suspended: deadline.suspended },
      {
        approachingWithinDays: settings.deadlineApproachingDays,
        imminentWithinDays: settings.deadlineImminentDays,
      },
    );
    if (status !== deadline.status) {
      await getDb().update(deadlines).set({ status, updatedAt: new Date() }).where(eq(deadlines.id, deadline.id));
    }
    if (deadline.suspended || deadline.reordered) continue;
    for (const offset of settings.reminderOffsetsDays) {
      if (!reminderIsDue(diff, offset)) continue;
      const key = reminderIdempotencyKey({
        deadlineId: deadline.id,
        offsetDays: offset,
        dueDate: deadline.dueOn,
        channel: "EMAIL",
      });
      const claimed = await getDb()
        .insert(reminderDeliveries)
        .values({ deadlineId: deadline.id, idempotencyKey: key, outcome: "PENDING" })
        .onConflictDoNothing()
        .returning();
      if (claimed.length === 0) continue;
      try {
        const profile = await getDb()
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.id, deadline.customerId))
          .limit(1);
        const email = profile[0]?.email;
        if (!email) {
          await getDb()
            .update(reminderDeliveries)
            .set({ outcome: "SKIPPED", error: "Nessun recapito" })
            .where(eq(reminderDeliveries.id, claimed[0]!.id));
          continue;
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const html = await renderServiceEmail({
          preview: "Una fornitura di lenti è in scadenza",
          greeting: `Ciao ${profile[0]?.firstName ?? ""},`,
          paragraphs: [
            "Ti ricordiamo che una fornitura di lenti a contatto si avvicina alla scadenza, oppure è già scaduta.",
            "Non inviamo parametri della configurazione in questa email.",
          ],
          ctaHref: `${appUrl}/area-personale/scadenze`,
          ctaLabel: "Riordina",
          secondaryHref: `${appUrl}/area-personale`,
          secondaryLabel: "Area personale",
        });
        const messageId = await sendTransactionalEmail({
          to: email,
          subject: "Promemoria fornitura lenti — Ottica Montinaro",
          html,
          category: offset < 0 ? "service" : "service",
        });
        await getDb()
          .update(reminderDeliveries)
          .set({ outcome: "SENT", providerMessageId: messageId, sentAt: new Date() })
          .where(eq(reminderDeliveries.id, claimed[0]!.id));
        sent += 1;
      } catch {
        failed += 1;
        await getDb()
          .update(reminderDeliveries)
          .set({ outcome: "FAILED", error: "Invio non riuscito" })
          .where(eq(reminderDeliveries.id, claimed[0]!.id));
      }
    }
  }

  const expiredReservations = await getDb()
    .update(pickupReservations)
    .set({ status: "EXPIRED", updatedAt: new Date() })
    .where(and(eq(pickupReservations.status, "ACTIVE"), lt(pickupReservations.reservedUntil, today)))
    .returning();

  await getDb()
    .update(prescriptions)
    .set({ status: "EXPIRED", updatedAt: new Date() })
    .where(and(eq(prescriptions.status, "VALIDATED"), lt(prescriptions.expiresAt, today)));

  const held = await getDb()
    .select()
    .from(subscriptions)
    .where(sql`${subscriptions.prescriptionId} is not null`);
  for (const subscription of held) {
    if (!subscription.prescriptionId) continue;
    const prescription = await getDb()
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, subscription.prescriptionId))
      .limit(1);
    if (prescription[0]?.status === "EXPIRED" && !subscription.fulfillmentHoldReason) {
      await getDb()
        .update(subscriptions)
        .set({
          fulfillmentHoldReason: "Configurazione scaduta: serve una nuova verifica prima della prossima consegna.",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));
    }
  }

  return { sent, failed, expiredReservations: expiredReservations.length, today: romeDateKey(today) };
}
