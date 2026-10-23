export const PRIVACY_ACCEPTANCE_LABEL =
  "Dichiaro di aver letto e compreso l'Informativa Privacy.";

export const MARKETING_CONSENT_LABEL =
  "Acconsento a ricevere novità e offerte commerciali da Ottica Montinaro.";

export function assertPrivacyAccepted(accepted: boolean): void {
  if (accepted !== true) {
    throw new Error("Per creare l'account devi accettare l'Informativa Privacy.");
  }
}

export function marketingChoice(accepted: boolean | undefined): boolean {
  return accepted === true;
}
