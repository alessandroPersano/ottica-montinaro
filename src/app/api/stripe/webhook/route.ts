import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { safeLog } from "@/lib/logger";
import { applyStripeEvent, verifyStripeEvent } from "@/server/stripe-flow";

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook Stripe non configurato." }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma mancante." }, { status: 400 });
  const raw = await request.text();
  try {
    const event = verifyStripeEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET);
    const result = await applyStripeEvent(event);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    safeLog("webhook stripe rifiutato", { reason: error instanceof Error ? error.name : "error" });
    return NextResponse.json({ error: "Evento non valido." }, { status: 400 });
  }
}
