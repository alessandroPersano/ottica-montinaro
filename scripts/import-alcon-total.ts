import { config } from "dotenv";
import { eq, inArray, sql } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { brands, manufacturers, productImages, productParameterRules, products } from "../src/db/schema";
import { alconBrandId, alconManufacturerId, alconTotalProducts } from "../src/server/alcon-total-catalog";

config({ path: ".env.vercel.local", override: true });

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("neon.tech")) {
    throw new Error("Serve il database online Neon. Manca una connessione Neon in .env.vercel.local.");
  }

  const database = getDb();
  await database
    .insert(manufacturers)
    .values({ id: alconManufacturerId, name: "Alcon", slug: "alcon" })
    .onConflictDoNothing();
  await database
    .insert(brands)
    .values({ id: alconBrandId, manufacturerId: alconManufacturerId, name: "TOTAL", slug: "total" })
    .onConflictDoNothing();

  const ids = alconTotalProducts.map((item) => item.id);
  await database
    .insert(products)
    .values(
      alconTotalProducts.map((item) => ({
        id: item.id,
        manufacturerId: alconManufacturerId,
        brandId: alconBrandId,
        commercialName: item.commercialName,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        lensType: item.lensType,
        geometry: item.geometry,
        material: item.material,
        waterContent: item.waterContent,
        lensesPerPack: item.lensesPerPack,
        replacementFrequencyDays: item.replacementFrequencyDays,
        sku: item.sku,
        priceCents: 0,
        vatRateBps: 2200,
        stockQty: null,
        status: "DRAFT" as const,
        allowSinglePurchase: false,
        allowSubscription: false,
        subscriptionIntervals: [],
        seoTitle: item.commercialName,
        seoDescription: item.shortDescription,
        isDemo: false,
      })),
    )
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        commercialName: sql`excluded.commercial_name`,
        shortDescription: sql`excluded.short_description`,
        description: sql`excluded.description`,
        lensType: sql`excluded.lens_type`,
        geometry: sql`excluded.geometry`,
        material: sql`excluded.material`,
        waterContent: sql`excluded.water_content`,
        lensesPerPack: sql`excluded.lenses_per_pack`,
        replacementFrequencyDays: sql`excluded.replacement_frequency_days`,
        sku: sql`excluded.sku`,
        seoTitle: sql`excluded.seo_title`,
        seoDescription: sql`excluded.seo_description`,
        updatedAt: new Date(),
      },
    });

  await database.delete(productImages).where(inArray(productImages.productId, ids));
  await database.insert(productImages).values(
    alconTotalProducts.map((item) => ({
      productId: item.id,
      path: item.imagePath,
      alt: item.imageAlt,
      sortOrder: 0,
    })),
  );
  await database
    .insert(productParameterRules)
    .values(alconTotalProducts.map((item) => ({ productId: item.id, rules: item.rules })))
    .onConflictDoUpdate({
      target: productParameterRules.productId,
      set: { rules: sql`excluded.rules`, updatedAt: new Date() },
    });

  const rows = await database
    .select({ name: products.commercialName, slug: products.slug, status: products.status })
    .from(products)
    .where(eq(products.brandId, alconBrandId));

  console.log(`Prodotti TOTAL nel database online: ${rows.length}`);
  for (const row of rows) console.log(`- ${row.name} (${row.slug}) ${row.status}`);
  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Importazione non riuscita");
  await closeDb();
  process.exit(1);
});
