import Link from "next/link";
import { cn } from "@/lib/utils";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 no-underline",
        variant === "primary" ? "bg-teal text-white" : "border border-line bg-white text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-line bg-white p-5 shadow-sm", className)}>{children}</section>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <Panel>
      <h2 className="mt-0 text-2xl">{title}</h2>
      <p className="text-muted">{body}</p>
    </Panel>
  );
}

export function Money({ cents }: { cents: number }) {
  return <span>{new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100)}</span>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-base">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "min-h-11 w-full rounded-xl border border-line bg-white px-3 text-lg";
