import { and, asc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { brands, manufacturers, productImages, productParameterRules, products } from "@/db/schema";
import type { ParameterRules } from "@/domain/parameters";

export type CatalogFilters = {
  q?: string;
  brand?: string;
  type?: string;
  geometry?: string;
  availability?: string;
  min?: string;
  max?: string;
};

export async function listPublicProducts(filters: CatalogFilters) {
  const conditions = [eq(products.status, "ACTIVE"), sql`${products.archivedAt} is null`];
  if (filters.q) conditions.push(ilike(products.commercialName, `%${filters.q}%`));
  if (filters.brand) conditions.push(eq(brands.slug, filters.brand));
  if (filters.type && isLensType(filters.type)) conditions.push(eq(products.lensType, filters.type));
  if (filters.geometry && isGeometry(filters.geometry)) conditions.push(eq(products.geometry, filters.geometry));
  if (filters.availability === "disponibile") {
    conditions.push(or(sql`${products.stockQty} is null`, sql`${products.stockQty} > 0`)!);
  }
  const min = eurosToCents(filters.min);
  const max = eurosToCents(filters.max);
  if (min != null) conditions.push(gte(products.priceCents, min));
  if (max != null) conditions.push(lte(products.priceCents, max));

  return getDb()
    .select({
      id: products.id,
      slug: products.slug,
      commercialName: products.commercialName,
      shortDescription: products.shortDescription,
      priceCents: products.priceCents,
      compareAtPriceCents: products.compareAtPriceCents,
      lensType: products.lensType,
      geometry: products.geometry,
      brandName: brands.name,
      image: productImages.path,
      imageAlt: productImages.alt,
      stockQty: products.stockQty,
      allowSubscription: products.allowSubscription,
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.sortOrder, 0)),
    )
    .where(and(...conditions))
    .orderBy(asc(products.commercialName));
}

export async function getProductBySlug(slug: string) {
  const rows = await getDb()
    .select()
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(and(eq(products.slug, slug), sql`${products.archivedAt} is null`))
    .limit(1);
  const row = rows[0];
  if (!row || row.products.status === "DRAFT") return null;
  const images = await getDb().select().from(productImages).where(eq(productImages.productId, row.products.id));
  const rulesRow = await getDb()
    .select()
    .from(productParameterRules)
    .where(eq(productParameterRules.productId, row.products.id))
    .limit(1);
  return {
    product: row.products,
    brand: row.brands,
    manufacturer: row.manufacturers,
    images,
    rules: (rulesRow[0]?.rules ?? null) as ParameterRules | null,
  };
}

export async function listBrands() {
  return getDb().select().from(brands).orderBy(asc(brands.name));
}

function isLensType(value: string): value is "DAILY" | "BIWEEKLY" | "MONTHLY" | "RIGID" | "OTHER" {
  return ["DAILY", "BIWEEKLY", "MONTHLY", "RIGID", "OTHER"].includes(value);
}

function isGeometry(value: string): value is "SPHERICAL" | "TORIC" | "MULTIFOCAL" | "COSMETIC" {
  return ["SPHERICAL", "TORIC", "MULTIFOCAL", "COSMETIC"].includes(value);
}

function eurosToCents(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}
