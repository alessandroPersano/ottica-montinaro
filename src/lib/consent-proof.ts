import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const PRIVACY_VERSION = "2026-10-bozza";

export function currentPrivacyVersion() {
  return PRIVACY_VERSION;
}

export function signConsentProof(email: string, version = PRIVACY_VERSION): string {
  const exp = Date.now() + 5 * 60 * 1000;
  const payload = `${email.trim().toLowerCase()}|${version}|${exp}`;
  const signature = createHmac("sha256", getServerEnv().BETTER_AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  return `${version}.${exp}.${signature}`;
}

export function verifyConsentProof(proof: string, email: string): boolean {
  const [version, expRaw, signature] = proof.split(".");
  if (!version || !expRaw || !signature) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `${email.trim().toLowerCase()}|${version}|${exp}`;
  const expected = createHmac("sha256", getServerEnv().BETTER_AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
