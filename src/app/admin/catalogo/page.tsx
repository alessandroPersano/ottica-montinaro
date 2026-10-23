export const instant = false;

import { asc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { AdminCatalogTable } from "@/components/admin-catalog-table";
import { getDb } from "@/db";
import { brands, products } from "@/db/schema";

export default async function AdminCatalogPage() {
  await connection();
  const rows = await getDb()
    .select({
      id: products.id,
      commercialName: products.commercialName,
      slug: products.slug,
      sku: products.sku,
      brandName: brands.name,
      lensType: products.lensType,
      geometry: products.geometry,
      lensesPerPack: products.lensesPerPack,
      replacementFrequencyDays: products.replacementFrequencyDays,
      priceCents: products.priceCents,
      stockQty: products.stockQty,
      status: products.status,
      allowSinglePurchase: products.allowSinglePurchase,
      allowSubscription: products.allowSubscription,
      isDemo: products.isDemo,
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .where(sql`${products.archivedAt} is null`)
    .orderBy(asc(products.commercialName));

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="mb-1">Catalogo</h1>
        <p className="m-0 text-muted">Cerca, ordina e aggiorna prezzo, giacenza e stato direttamente in tabella.</p>
      </div>
      <AdminCatalogTable rows={rows} />
    </div>
  );
}
