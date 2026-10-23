import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireStaffPage } from "@/server/guard";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/ordini", "Ordini"],
  ["/admin/ritiri", "Ritiri da incassare"],
  ["/admin/incassi", "Incassi in negozio"],
  ["/admin/prescrizioni", "Prescrizioni"],
  ["/admin/clienti", "Clienti"],
  ["/admin/scadenziario", "Scadenziario"],
  ["/admin/catalogo", "Catalogo"],
  ["/admin/impostazioni", "Impostazioni"],
] as const;

export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Caricamento ufficio…</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  await connection();
  await requireStaffPage("orders");
  return (
    <div className="mx-auto grid max-w-[88rem] gap-6 px-4 py-6 md:grid-cols-[14rem_1fr]">
      <nav aria-label="Ufficio" className="grid content-start gap-2">
        {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div>{children}</div>
    </div>
  );
}
