import { Body, Button, Container, Head, Hr, Html, Preview, Text } from "@react-email/components";
import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";
import { emailOutboxEnabled, getServerEnv } from "@/lib/env";
import { safeLog } from "@/lib/logger";

const brand = {
  background: "#FBF8F3",
  ink: "#14232B",
  teal: "#0E4D5C",
};

export function ServiceEmail(props: {
  preview: string;
  greeting: string;
  paragraphs: string[];
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Html lang="it">
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={{ backgroundColor: brand.background, color: brand.ink, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container style={{ padding: "32px 24px" }}>
          <Text style={{ fontSize: "22px", letterSpacing: "0.04em" }}>Ottica Montinaro</Text>
          <Text style={{ fontSize: "16px", lineHeight: "1.6" }}>{props.greeting}</Text>
          {props.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={{ fontSize: "16px", lineHeight: "1.6" }}>
              {paragraph}
            </Text>
          ))}
          {props.ctaHref && props.ctaLabel ? (
            <Button href={props.ctaHref} style={{ backgroundColor: brand.teal, color: "#fff", padding: "12px 18px" }}>
              {props.ctaLabel}
            </Button>
          ) : null}
          {props.secondaryHref && props.secondaryLabel ? (
            <Text>
              <a href={props.secondaryHref}>{props.secondaryLabel}</a>
            </Text>
          ) : null}
          <Hr />
          <Text style={{ fontSize: "14px" }}>
            Ottica Montinaro, Via Roma 14, 73021 Calimera (LE). Telefono 0832 873284. Questo messaggio riguarda un ordine,
            un abbonamento o una scadenza del servizio.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderServiceEmail(props: Parameters<typeof ServiceEmail>[0]) {
  return render(<ServiceEmail {...props} />);
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  category: "service" | "marketing";
}) {
  const env = getServerEnv();
  if (input.category === "marketing") {
    safeLog("email marketing accodata", { to: input.to, subject: input.subject });
  }

  if (env.RESEND_API_KEY && env.EMAIL_FROM && !emailOutboxEnabled(env)) {
    const resend = new Resend(env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (result.error) {
      throw new Error("Invio email non riuscito.");
    }
    return result.data?.id ?? null;
  }

  await getDb().insert(emailOutbox).values({
    recipient: input.to,
    subject: input.subject,
    html: input.html,
    category: input.category,
  });
  return "outbox";
}

export async function latestOutboxFor(recipient: string) {
  const rows = await getDb()
    .select()
    .from(emailOutbox)
    .where(eq(emailOutbox.recipient, recipient));
  return rows.at(-1) ?? null;
}
