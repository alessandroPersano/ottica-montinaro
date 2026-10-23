import { formatInTimeZone } from "date-fns-tz";

export const ROME_TIME_ZONE = "Europe/Rome";

/** Data civile a Roma, nel formato yyyy-MM-dd. */
export function romeDateKey(instant: Date): string {
  return formatInTimeZone(instant, ROME_TIME_ZONE, "yyyy-MM-dd");
}

/** Aggiunge giorni civili a una data yyyy-MM-dd, senza dipendere dal fuso del server. */
export function addCalendarDays(dateKey: string, days: number): string {
  if (!Number.isInteger(days)) {
    throw new Error("Il numero di giorni deve essere intero.");
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error("Data non valida.");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Differenza in giorni civili fra due date yyyy-MM-dd (a - b). */
export function calendarDaysBetween(laterKey: string, earlierKey: string): number {
  const later = parseDateKey(laterKey);
  const earlier = parseDateKey(earlierKey);
  return Math.round((later - earlier) / 86_400_000);
}

function parseDateKey(dateKey: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error("Data non valida.");
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
