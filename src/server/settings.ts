import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { SETTINGS_KEY, defaultSettings, settingsSchema, type StoreSettings } from "@/lib/settings";

export async function getSettings(): Promise<StoreSettings> {
  const rows = await getDb().select().from(appSettings).where(eq(appSettings.key, SETTINGS_KEY)).limit(1);
  const value = rows[0]?.value;
  const parsed = settingsSchema.safeParse(value);
  if (!parsed.success) return defaultSettings;
  return parsed.data;
}

export async function saveSettings(value: StoreSettings, actorId: string) {
  const parsed = settingsSchema.parse(value);
  await getDb()
    .insert(appSettings)
    .values({ key: SETTINGS_KEY, value: parsed, updatedBy: actorId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: parsed, updatedBy: actorId, updatedAt: new Date() },
    });
  return parsed;
}
