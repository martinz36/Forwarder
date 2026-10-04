/** Clases de botón (sirve en componentes de servidor y de cliente). */
export function buttonClass(variant: "primary" | "secondary" | "quiet" = "primary") {
  const base = "press inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-base font-medium";
  if (variant === "primary") return `${base} bg-signal text-white hover:bg-[#a8380a]`;
  if (variant === "secondary") return `${base} border border-rule bg-surface text-ink hover:border-ink-3`;
  return `${base} text-navy hover:bg-navy/5`;
}
