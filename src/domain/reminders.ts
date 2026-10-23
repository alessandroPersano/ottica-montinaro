/** Chiave stabile: un invio per scadenza, intervallo e data di riferimento. */
export function reminderIdempotencyKey(input: {
  deadlineId: string;
  offsetDays: number;
  dueDate: string;
  channel: "EMAIL";
}): string {
  if (!input.deadlineId) throw new Error("Scadenza mancante.");
  if (!Number.isInteger(input.offsetDays)) throw new Error("Intervallo non valido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw new Error("Data di scadenza non valida.");
  return `${input.channel}:${input.deadlineId}:${input.offsetDays}:${input.dueDate}`;
}

/**
 * offsetDays è negativo prima della scadenza, zero il giorno stesso, positivo dopo.
 * diffDays è la distanza civile: data scadenza meno oggi.
 */
export function reminderIsDue(diffDays: number, offsetDays: number): boolean {
  return diffDays + offsetDays === 0;
}
