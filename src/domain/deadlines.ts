import { addCalendarDays, calendarDaysBetween, romeDateKey } from "@/domain/time";

export const DEADLINE_STATUSES = [
  "FUTURE",
  "APPROACHING",
  "IMMINENT",
  "TODAY",
  "OVERDUE",
  "REORDERED",
  "SUSPENDED",
] as const;

export type DeadlineStatus = (typeof DEADLINE_STATUSES)[number];

export type DeadlineThresholds = {
  approachingWithinDays: number;
  imminentWithinDays: number;
};

export const DEFAULT_DEADLINE_THRESHOLDS: DeadlineThresholds = {
  approachingWithinDays: 30,
  imminentWithinDays: 14,
};

export function classifyDeadline(
  diffDays: number,
  flags: { reordered?: boolean; suspended?: boolean },
  thresholds: DeadlineThresholds = DEFAULT_DEADLINE_THRESHOLDS,
): DeadlineStatus {
  if (flags.suspended) return "SUSPENDED";
  if (flags.reordered) return "REORDERED";
  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "TODAY";
  if (diffDays <= thresholds.imminentWithinDays) return "IMMINENT";
  if (diffDays <= thresholds.approachingWithinDays) return "APPROACHING";
  return "FUTURE";
}

/** Scadenza civile a partire dal giorno di consegna a Roma e dai giorni di copertura. */
export function nextDeadlineDateKey(deliveredAt: Date, supplyDays: number): string {
  if (!Number.isInteger(supplyDays) || supplyDays < 1) {
    throw new Error("I giorni di copertura non sono validi.");
  }
  return addCalendarDays(romeDateKey(deliveredAt), supplyDays);
}

export function deadlineDiffDays(dueDateKey: string, now: Date): number {
  return calendarDaysBetween(dueDateKey, romeDateKey(now));
}
