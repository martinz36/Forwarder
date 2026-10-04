"use client";

import { useFormStatus } from "react-dom";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink-3 focus:border-navy focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal"
      />
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press inline-flex w-full items-center justify-center rounded-sm bg-signal px-4 py-2.5 font-medium text-white hover:bg-[#a8380a] disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm bg-bad/10 px-3 py-2 text-sm text-bad">
      {message}
    </p>
  );
}
