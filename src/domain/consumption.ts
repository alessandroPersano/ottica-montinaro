export type EyeSupplyInput = {
  lensesPerPack: number;
  packs: number;
  replacementFrequencyDays: number;
  manualDurationDays?: number | null;
};

function assertPositiveInt(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} deve essere un intero maggiore di zero.`);
  }
}

/** Giorni di copertura di un occhio. La durata manuale, se presente, prevale sul calcolo. */
export function supplyDaysForEye(input: EyeSupplyInput): number {
  if (input.manualDurationDays != null) {
    assertPositiveInt(input.manualDurationDays, "La durata manuale");
    return input.manualDurationDays;
  }
  assertPositiveInt(input.lensesPerPack, "Il numero di lenti per confezione");
  assertPositiveInt(input.packs, "La quantità di confezioni");
  assertPositiveInt(input.replacementFrequencyDays, "La frequenza di sostituzione");
  return input.lensesPerPack * input.packs * input.replacementFrequencyDays;
}

/**
 * Con entrambi gli occhi, la prossima scadenza è la copertura che finisce prima.
 * Le confezioni non vengono divise fra i due occhi: ogni occhio ha la propria quantità.
 */
export function earliestSupplyDays(eyeDays: number[]): number {
  if (eyeDays.length === 0) {
    throw new Error("Indica almeno un occhio.");
  }
  for (const days of eyeDays) {
    assertPositiveInt(days, "La copertura");
  }
  return Math.min(...eyeDays);
}
