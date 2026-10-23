"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateCatalogProduct } from "@/app/actions/admin";

export type CatalogRow = {
  id: string;
  commercialName: string;
  slug: string;
  sku: string;
  brandName: string;
  lensType: "DAILY" | "BIWEEKLY" | "MONTHLY" | "RIGID" | "OTHER";
  geometry: "SPHERICAL" | "TORIC" | "MULTIFOCAL" | "COSMETIC";
  lensesPerPack: number;
  replacementFrequencyDays: number;
  priceCents: number;
  stockQty: number | null;
  status: "ACTIVE" | "DRAFT" | "UNAVAILABLE";
  allowSinglePurchase: boolean;
  allowSubscription: boolean;
  isDemo: boolean;
};

const typeLabel: Record<CatalogRow["lensType"], string> = {
  DAILY: "Giornaliera",
  BIWEEKLY: "Bisettimanale",
  MONTHLY: "Mensile",
  RIGID: "Rigida",
  OTHER: "Altro",
};

const geometryLabel: Record<CatalogRow["geometry"], string> = {
  SPHERICAL: "Sferica",
  TORIC: "Torica",
  MULTIFOCAL: "Multifocale",
  COSMETIC: "Cosmetica",
};

const statusLabel: Record<CatalogRow["status"], string> = {
  ACTIVE: "In vendita",
  DRAFT: "Bozza",
  UNAVAILABLE: "Non disponibile",
};

type SortKey = "name" | "sku" | "type" | "geometry" | "price" | "stock" | "status";

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function AdminCatalogTable({ rows }: { rows: CatalogRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [lensType, setLensType] = useState("ALL");
  const [geometry, setGeometry] = useState("ALL");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const needle = query.trim().toLocaleLowerCase("it");
  const visible = rows
    .filter((row) => {
      if (status !== "ALL" && row.status !== status) return false;
      if (lensType !== "ALL" && row.lensType !== lensType) return false;
      if (geometry !== "ALL" && row.geometry !== geometry) return false;
      if (!needle) return true;
      return [row.commercialName, row.sku, row.brandName].some((value) => value.toLocaleLowerCase("it").includes(needle));
    })
    .sort((a, b) => compareRows(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1));

  const drafts = rows.filter((row) => row.status === "DRAFT").length;
  const active = rows.filter((row) => row.status === "ACTIVE").length;

  function toggleSort(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3 text-base text-muted">
        <span>{rows.length} in elenco</span>
        <span>{drafts} bozze</span>
        <span>{active} in vendita</span>
        <span>{visible.length} visibili</span>
        <label className="ml-auto grid gap-1 text-foreground">
          <span className="font-semibold">Ordina</span>
          <span className="flex gap-2">
            <select className="min-h-11 rounded-xl border border-line bg-white px-3" value={sort.key} onChange={(event) => setSort({ key: event.target.value as SortKey, dir: sort.dir })}>
              <option value="name">Nome</option>
              <option value="sku">SKU</option>
              <option value="type">Ricambio</option>
              <option value="geometry">Geometria</option>
              <option value="price">Prezzo</option>
              <option value="stock">Giacenza</option>
              <option value="status">Stato</option>
            </select>
            <button className="min-h-11 rounded-xl border border-line bg-white px-3 font-semibold" type="button" onClick={() => setSort((current) => ({ ...current, dir: current.dir === "asc" ? "desc" : "asc" }))}>
              {sort.dir === "asc" ? "Crescente" : "Decrescente"}
            </button>
          </span>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <label className="grid gap-1 text-base">
          <span className="font-semibold text-foreground">Cerca</span>
          <input
            className="min-h-11 rounded-xl border border-line bg-white px-3"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, marca o SKU"
          />
        </label>
        <Filter label="Stato" value={status} onChange={setStatus} options={[["ALL", "Tutti"], ["DRAFT", "Bozza"], ["ACTIVE", "In vendita"], ["UNAVAILABLE", "Non disponibile"]]} />
        <Filter label="Ricambio" value={lensType} onChange={setLensType} options={[["ALL", "Tutti"], ["DAILY", "Giornaliera"], ["BIWEEKLY", "Bisettimanale"], ["MONTHLY", "Mensile"], ["RIGID", "Rigida"], ["OTHER", "Altro"]]} />
        <Filter label="Geometria" value={geometry} onChange={setGeometry} options={[["ALL", "Tutte"], ["SPHERICAL", "Sferica"], ["TORIC", "Torica"], ["MULTIFOCAL", "Multifocale"], ["COSMETIC", "Cosmetica"]]} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left text-base">
          <caption className="sr-only">Lenti a contatto del catalogo interno</caption>
          <thead>
            <tr>
              <SortHeader label="Prodotto" sortKey="name" sort={sort} onSort={toggleSort} />
              <SortHeader label="Prezzo €" sortKey="price" sort={sort} onSort={toggleSort} />
              <SortHeader label="Giacenza" sortKey="stock" sort={sort} onSort={toggleSort} />
              <SortHeader label="Stato" sortKey="status" sort={sort} onSort={toggleSort} />
              <th className="sticky top-0 z-10 border-b border-line bg-[#f7f1e7] px-3 py-3 font-semibold">Vendita</th>
              <th className="sticky top-0 z-10 border-b border-line bg-[#f7f1e7] px-3 py-3 font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-muted" colSpan={6}>Nessuna lente corrisponde ai filtri.</td>
              </tr>
            ) : visible.map((row) => <CatalogEditor key={row.id} row={row} />)}
          </tbody>
        </table>
      </div>
      <p className="text-base text-muted">La giacenza vuota significa che non la tieni a magazzino in questa scheda. Una bozza con prezzo zero non compare nel catalogo pubblico.</p>
    </div>
  );
}

function CatalogEditor({ row }: { row: CatalogRow }) {
  const [price, setPrice] = useState(formatPrice(row.priceCents));
  const [stock, setStock] = useState(row.stockQty == null ? "" : String(row.stockQty));
  const [status, setStatus] = useState(row.status);
  const [single, setSingle] = useState(row.allowSinglePurchase);
  const [subscription, setSubscription] = useState(row.allowSubscription);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const savedPrice = formatPrice(row.priceCents);
  const savedStock = row.stockQty == null ? "" : String(row.stockQty);
  const dirty = price !== savedPrice || stock !== savedStock || status !== row.status || single !== row.allowSinglePurchase || subscription !== row.allowSubscription;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateCatalogProduct(formData);
      setMessage(result.message);
    });
  }

  return (
    <tr className="odd:bg-white even:bg-[#fbf8f3]">
      <td className="border-b border-line px-3 py-3 align-top">
        <div className="font-semibold">{row.commercialName}</div>
        <div className="text-muted">{row.brandName}{row.isDemo ? " · demo" : ""} · {row.sku}</div>
        <div>{typeLabel[row.lensType]} · {geometryLabel[row.geometry]} · {row.lensesPerPack} lenti / {row.replacementFrequencyDays} giorni</div>
        {row.status === "ACTIVE" ? <a href={`/prodotto/${row.slug}`}>Apri la scheda pubblica</a> : <span className="text-muted">Non in vetrina</span>}
      </td>
      <td className="border-b border-line px-3 py-3 align-top">
        <input className={cellInput} aria-label={`Prezzo di ${row.commercialName}`} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
      </td>
      <td className="border-b border-line px-3 py-3 align-top">
        <input className={cellInput} aria-label={`Giacenza di ${row.commercialName}`} inputMode="numeric" value={stock} onChange={(event) => setStock(event.target.value)} />
      </td>
      <td className="border-b border-line px-3 py-3 align-top">
        <select className={cellInput} aria-label={`Stato di ${row.commercialName}`} value={status} onChange={(event) => setStatus(event.target.value as CatalogRow["status"])}>
          <option value="DRAFT">Bozza</option>
          <option value="ACTIVE">In vendita</option>
          <option value="UNAVAILABLE">Non disponibile</option>
        </select>
        <div className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-sm ${statusTone[status]}`}>{statusLabel[status]}</div>
      </td>
      <td className="border-b border-line px-3 py-3 align-top">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={single} onChange={(event) => setSingle(event.target.checked)} />
          Singola
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input type="checkbox" checked={subscription} onChange={(event) => setSubscription(event.target.checked)} />
          Abbonamento
        </label>
      </td>
      <td className="border-b border-line px-3 py-3 align-top">
        <form id={row.id} onSubmit={onSubmit} className="grid justify-items-start gap-2">
          <input type="hidden" name="productId" value={row.id} />
          <input type="hidden" name="price" value={price} />
          <input type="hidden" name="stock" value={stock} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="allowSinglePurchase" value={single ? "true" : "false"} />
          <input type="hidden" name="allowSubscription" value={subscription ? "true" : "false"} />
          <button className="min-h-10 rounded-xl bg-teal px-4 text-white disabled:opacity-50" type="submit" disabled={pending || !dirty}>
            {pending ? "Salvo…" : "Salva"}
          </button>
          {message ? <p className="m-0 max-w-48 text-sm" role="status">{message}</p> : null}
        </form>
      </td>
    </tr>
  );
}

const cellInput = "min-h-10 w-full min-w-28 rounded-lg border border-line bg-white px-2";

const statusTone: Record<CatalogRow["status"], string> = {
  ACTIVE: "bg-[#e5f3ec] text-[#1f6b4a]",
  DRAFT: "bg-[#f6efe2] text-[#8c6a32]",
  UNAVAILABLE: "bg-[#f8e8e8] text-[#8f2d2d]",
};

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="grid gap-1 text-base">
      <span className="font-semibold text-foreground">{label}</span>
      <select className="min-h-11 rounded-xl border border-line bg-white px-3" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function SortHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (key: SortKey) => void }) {
  const active = sort.key === sortKey;
  return (
    <th className="sticky top-0 z-10 border-b border-line bg-[#f7f1e7] px-3 py-3" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-semibold text-foreground" type="button" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

function compareRows(a: CatalogRow, b: CatalogRow, key: SortKey) {
  if (key === "name") return a.commercialName.localeCompare(b.commercialName, "it");
  if (key === "sku") return a.sku.localeCompare(b.sku, "it");
  if (key === "type") return typeLabel[a.lensType].localeCompare(typeLabel[b.lensType], "it");
  if (key === "geometry") return geometryLabel[a.geometry].localeCompare(geometryLabel[b.geometry], "it");
  if (key === "price") return a.priceCents - b.priceCents;
  if (key === "stock") return (a.stockQty ?? Number.MAX_SAFE_INTEGER) - (b.stockQty ?? Number.MAX_SAFE_INTEGER);
  return statusLabel[a.status].localeCompare(statusLabel[b.status], "it");
}
