import { and, eq } from "drizzle-orm";
import { validateEyeParameters, type EyeParameters, type ParameterRules } from "@/domain/parameters";
import { getDb } from "@/db";
import {
  auditLogs,
  consentEvents,
  prescriptionEyes,
  prescriptions,
  products,
  productParameterRules,
} from "@/db/schema";
import { getSettings } from "@/server/settings";
import { createHash } from "node:crypto";

export async function createPrescription(input: {
  customerId: string;
  userId: string;
  productId: string;
  right?: EyeParameters | null;
  left?: EyeParameters | null;
  clinicalConsent: boolean;
}) {
  if (!input.right && !input.left) throw new Error("Indica almeno un occhio.");
  const settings = await getSettings();
  const productRows = await getDb().select().from(products).where(eq(products.id, input.productId)).limit(1);
  const product = productRows[0];
  if (!product) throw new Error("Prodotto non trovato.");
  const ruleRows = await getDb()
    .select()
    .from(productParameterRules)
    .where(eq(productParameterRules.productId, product.id))
    .limit(1);
  const rules = ruleRows[0]?.rules as ParameterRules | undefined;
  if (!rules) throw new Error("Questo prodotto non ha ancora una gamma parametri.");
  for (const eye of [input.right, input.left]) {
    if (!eye) continue;
    const errors = validateEyeParameters(rules, eye);
    if (errors.length) throw new Error(errors[0] ?? "Parametri non validi.");
  }
  if (settings.clinicalConsentRequired && input.clinicalConsent !== true) {
    throw new Error("Per salvare la configurazione serve il consenso indicato. Il testo è una bozza da far revisionare.");
  }
  const expiresBase = settings.prescriptionValidityDays;
  const [created] = await getDb()
    .insert(prescriptions)
    .values({
      customerId: input.customerId,
      productId: product.id,
      status: "PENDING_REVIEW",
      clinicalConsentVersion: input.clinicalConsent ? "clinical-placeholder-2026-10" : null,
    })
    .returning();
  if (!created) throw new Error("Configurazione non salvata.");
  const eyes = [
    input.right ? { eye: "RIGHT" as const, params: input.right } : null,
    input.left ? { eye: "LEFT" as const, params: input.left } : null,
  ].filter((value) => value != null);
  await getDb().insert(prescriptionEyes).values(
    eyes.map((entry) => ({
      prescriptionId: created.id,
      eye: entry.eye,
      productId: product.id,
      sphere: String(entry.params.sphere),
      cylinder: entry.params.cylinder == null ? null : String(entry.params.cylinder),
      axis: entry.params.axis == null ? null : String(entry.params.axis),
      addition: entry.params.addition ?? null,
      baseCurve: entry.params.baseCurve,
      diameter: entry.params.diameter,
      dominance: entry.params.dominance ?? null,
      color: entry.params.color ?? null,
    })),
  );
  if (input.clinicalConsent) {
    await getDb().insert(consentEvents).values({
      userId: input.userId,
      customerId: input.customerId,
      documentType: "CLINICAL_PLACEHOLDER",
      documentVersion: "clinical-placeholder-2026-10",
      accepted: true,
      source: "CHECKOUT",
      textHash: createHash("sha256").update("clinical-placeholder-2026-10").digest("hex"),
    });
  }
  void expiresBase;
  return created.id;
}

export async function requestPrescriptionChange(input: { customerId: string; prescriptionId: string; note: string }) {
  const rows = await getDb()
    .select()
    .from(prescriptions)
    .where(and(eq(prescriptions.id, input.prescriptionId), eq(prescriptions.customerId, input.customerId)))
    .limit(1);
  const prescription = rows[0];
  if (!prescription) throw new Error("Configurazione non trovata.");
  if (prescription.status !== "VALIDATED") {
    throw new Error("Puoi chiedere una modifica solo su una configurazione già verificata.");
  }
  await getDb()
    .update(prescriptions)
    .set({ status: "PENDING_REVIEW", changeRequest: input.note.trim(), updatedAt: new Date() })
    .where(eq(prescriptions.id, prescription.id));
}

export async function validatePrescription(input: { prescriptionId: string; staffId: string }) {
  const settings = await getSettings();
  const expiresAt = new Date(Date.now() + settings.prescriptionValidityDays * 86_400_000);
  await getDb()
    .update(prescriptions)
    .set({
      status: "VALIDATED",
      validatedById: input.staffId,
      lastVerifiedAt: new Date(),
      expiresAt,
      changeRequest: null,
      updatedAt: new Date(),
    })
    .where(eq(prescriptions.id, input.prescriptionId));
  await getDb().insert(auditLogs).values({
    actorId: input.staffId,
    action: "prescription.validate",
    entity: "prescription",
    entityId: input.prescriptionId,
    metadata: { expiresOn: expiresAt.toISOString().slice(0, 10) },
  });
}
