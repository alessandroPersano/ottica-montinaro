import { connection } from "next/server";
import { Suspense } from "react";

export const instant = false;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="p-8">Caricamento area personale…</main>}>
      <Ready>{children}</Ready>
    </Suspense>
  );
}

async function Ready({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
