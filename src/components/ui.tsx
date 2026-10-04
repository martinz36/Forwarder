import Link from "next/link";
import type { Tone } from "@/lib/labels";

const TONES: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink-2",
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  info: "bg-info/10 text-info",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Códigos que se leen y dictan: COT-2026-0004, L-2026-0003, BL. */
export function Code({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono tracking-tight ${className}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  meta,
  aside,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">{eyebrow}</div>}
        <h1 className="text-lg font-semibold text-ink sm:text-xl">{title}</h1>
        {meta && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">{meta}</div>}
      </div>
      {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
    </header>
  );
}

export function Section({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-md font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Ficha de datos en grilla: etiqueta arriba, valor abajo. */
export function Facts({ items }: { items: { label: string; value: React.ReactNode; mono?: boolean }[] }) {
  const visible = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (!visible.length) return <p className="text-sm text-ink-3">Sin datos registrados.</p>;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((item) => (
        <div key={item.label} className="min-w-0 bg-surface px-3 py-2.5">
          <dt className="text-xs text-ink-3">{item.label}</dt>
          <dd className={`mt-0.5 break-words text-ink ${item.mono ? "font-mono text-sm" : ""}`}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-rule bg-surface/60 px-4 py-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <p className="mt-1 text-sm text-ink-3">{children}</p>}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-navy underline decoration-rule underline-offset-4 hover:decoration-navy">
      {children}
    </Link>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-md border border-rule bg-surface ${className}`}>{children}</div>;
}
