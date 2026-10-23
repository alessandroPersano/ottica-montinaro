import { z } from "zod";

export const settingsSchema = z.object({
  freeShippingThresholdCents: z.number().int().nonnegative(),
  shippingCostCents: z.number().int().nonnegative(),
  pickupReservationDays: z.number().int().min(1).max(90),
  payAtPickupEnabled: z.boolean(),
  payAtPickupCash: z.boolean(),
  payAtPickupCard: z.boolean(),
  payAtPickupMaxCents: z.number().int().positive().nullable(),
  reminderOffsetsDays: z.array(z.number().int()).min(1),
  prescriptionValidityDays: z.number().int().min(30).max(3650),
  pickupAddress: z.string().min(5),
  pickupInstructions: z.string().min(5),
  storeHours: z.string().min(1).nullable(),
  supportEmail: z.string().email().nullable(),
  supportPhone: z.string().min(5).nullable(),
  cancellationWindowHours: z.number().int().min(0).max(240),
  subscriptionIntervals: z.array(z.number().int().positive()).min(1),
  clinicalConsentRequired: z.boolean(),
  deadlineApproachingDays: z.number().int().min(1),
  deadlineImminentDays: z.number().int().min(1),
  retentionOrdersYears: z.number().int().min(1).max(20),
  brandProvisional: z.boolean(),
});

export type StoreSettings = z.infer<typeof settingsSchema>;

export const defaultSettings: StoreSettings = {
  freeShippingThresholdCents: 6000,
  shippingCostCents: 590,
  pickupReservationDays: 7,
  payAtPickupEnabled: true,
  payAtPickupCash: true,
  payAtPickupCard: true,
  payAtPickupMaxCents: null,
  reminderOffsetsDays: [-30, -14, -7, 0, 7],
  prescriptionValidityDays: 365,
  pickupAddress: "Via Roma 14, 73021 Calimera (LE)",
  pickupInstructions:
    "Porta un documento e il numero ordine. Se non hai pagato online, potrai pagare in negozio in contanti o con carta.",
  storeHours: null,
  supportEmail: null,
  supportPhone: "0832 873284",
  cancellationWindowHours: 24,
  subscriptionIntervals: [30, 60, 90],
  clinicalConsentRequired: true,
  deadlineApproachingDays: 30,
  deadlineImminentDays: 14,
  retentionOrdersYears: 10,
  brandProvisional: true,
};

export const SETTINGS_KEY = "store";
