import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL è obbligatoria"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET deve avere almeno 32 caratteri"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL deve essere un URL"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL deve essere un URL"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET deve avere almeno 16 caratteri"),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_OUTBOX: z.enum(["true", "false"]).optional(),
  E2E_TEST_HELPERS: z.enum(["true", "false"]).optional(),
  AUTO_MIGRATE: z.enum(["true", "false"]).optional(),
  SEED_ON_BOOT: z.enum(["true", "false"]).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

const productionRequired = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    STRIPE_SECRET_KEY: emptyToUndefined(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: emptyToUndefined(process.env.STRIPE_WEBHOOK_SECRET),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    RESEND_API_KEY: emptyToUndefined(process.env.RESEND_API_KEY),
    EMAIL_FROM: emptyToUndefined(process.env.EMAIL_FROM),
    EMAIL_OUTBOX: emptyToUndefined(process.env.EMAIL_OUTBOX),
    E2E_TEST_HELPERS: emptyToUndefined(process.env.E2E_TEST_HELPERS),
    AUTO_MIGRATE: emptyToUndefined(process.env.AUTO_MIGRATE),
    SEED_ON_BOOT: emptyToUndefined(process.env.SEED_ON_BOOT),
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configurazione incompleta. ${details}`);
  }

  if (process.env.VERCEL_ENV === "production") {
    const missing = productionRequired.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(
        `Integrazioni non configurate: ${missing.join(", ")}. Pagamenti carta online e email reali restano disattivi finché non le imposti su Vercel.`,
      );
    }
  }

  cached = parsed.data;
  return cached;
}

export function resetEnvCache() {
  cached = null;
}

export function stripeConfigured(env = getServerEnv()) {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function emailOutboxEnabled(env = getServerEnv()) {
  return env.EMAIL_OUTBOX === "true" || process.env.NODE_ENV !== "production";
}

function emptyToUndefined(value: string | undefined) {
  if (!value || value.trim() === "") return undefined;
  return value;
}
