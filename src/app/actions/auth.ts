"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { z } from "zod";
import { assertPrivacyAccepted, marketingChoice } from "@/domain/privacy";
import { auth } from "@/lib/auth";
import { currentPrivacyVersion, signConsentProof } from "@/lib/consent-proof";
import { getDb } from "@/db";
import { consentEvents, customerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertRateLimit, clientKey } from "@/server/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(3, "Indica nome e cognome."),
  email: z.string().trim().email("Indica un'email valida."),
  password: z.string().min(10, "La password deve avere almeno 10 caratteri.").regex(/[A-Za-z]/, "Servono anche delle lettere.").regex(/[0-9]/, "Servono anche dei numeri."),
  privacyAccepted: z.boolean().refine((value) => value === true, {
    message: "Per creare l'account devi accettare l'Informativa Privacy.",
  }),
  marketingAccepted: z.boolean().optional(),
});

export async function registerAccount(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    privacyAccepted: formData.get("privacyAccepted") === "on",
    marketingAccepted: formData.get("marketingAccepted") === "on",
  });
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Controlla i dati inseriti." };
  }
  try {
    assertPrivacyAccepted(parsed.data.privacyAccepted);
    const requestHeaders = await headers();
    await assertRateLimit(clientKey("register", requestHeaders), 5);
    const proof = signConsentProof(parsed.data.email, currentPrivacyVersion());
    const result = await auth.api.signUpEmail({
      body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
      headers: new Headers({ "x-om-consent": proof }),
    });
    const userId = result.user.id;
    const marketing = marketingChoice(parsed.data.marketingAccepted);
    const privacyHash = createHash("sha256").update(currentPrivacyVersion()).digest("hex");
    await getDb().insert(consentEvents).values({
      userId,
      documentType: "PRIVACY",
      documentVersion: currentPrivacyVersion(),
      accepted: true,
      source: "SIGNUP",
      textHash: privacyHash,
    });
    await getDb().insert(consentEvents).values({
      userId,
      documentType: "MARKETING",
      documentVersion: "marketing-2026-10",
      accepted: marketing,
      source: "SIGNUP",
      textHash: createHash("sha256").update("marketing-2026-10").digest("hex"),
    });
    await getDb()
      .update(customerProfiles)
      .set({ marketingConsent: marketing, updatedAt: new Date() })
      .where(eq(customerProfiles.userId, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registrazione non riuscita.";
    return { ok: false as const, message };
  }
  redirect("/accesso?registrato=1");
}
