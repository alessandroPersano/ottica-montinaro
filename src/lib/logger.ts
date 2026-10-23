const SENSITIVE = /password|token|secret|authorization|cookie|sphere|cylinder|axis|addition|prescription|prescrizione|fiscal|codice/i;

export function safeLog(message: string, details?: Record<string, unknown>) {
  const scrubbed = details ? scrub(details) : undefined;
  console.info(`[ottica] ${message}`, scrubbed ?? "");
}

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = SENSITIVE.test(key) ? "[omesso]" : scrub(entry);
  }
  return output;
}
