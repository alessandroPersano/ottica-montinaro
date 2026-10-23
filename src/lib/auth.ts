import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { customerProfiles, rateLimit, account, session, user, verification } from "@/db/schema";
import { verifyConsentProof } from "@/lib/consent-proof";
import { getServerEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/server/email";

const env = getServerEnv();

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification, rateLimit },
  }),
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user: accountUser, url }) => {
      await sendTransactionalEmail({
        to: accountUser.email,
        subject: "Reimposta la password — Ottica Montinaro",
        category: "service",
        html: `<p>Ciao ${escapeHtml(accountUser.name)},</p><p><a href="${url}">Scegli una nuova password</a>.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: accountUser, url }) => {
      await sendTransactionalEmail({
        to: accountUser.email,
        subject: "Conferma il tuo indirizzo email — Ottica Montinaro",
        category: "service",
        html: `<p>Ciao ${escapeHtml(accountUser.name)},</p><p><a href="${url}">Conferma l'indirizzo email</a> per entrare.</p>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    freshAge: 60 * 10,
  },
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          const parts = created.name.trim().split(/\s+/);
          await getDb().insert(customerProfiles).values({
            userId: created.id,
            firstName: parts[0] || "Cliente",
            lastName: parts.slice(1).join(" ") || "—",
            email: created.email,
            contactPreferences: { email: true, phone: false },
          });
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      const proof = ctx.headers?.get("x-om-consent") ?? "";
      if (!verifyConsentProof(proof, email)) {
        throw new APIError("BAD_REQUEST", {
          message: "Per creare l'account devi accettare l'Informativa Privacy.",
        });
      }
    }),
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
