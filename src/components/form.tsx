"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/button";

/**
 * Formulario que llama a una acción del servidor sin el reinicio automático de React 19
 * (que borra todo lo escrito aunque la acción devuelva un error).
 */
export function ActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const data = new FormData(e.currentTarget, submitter);
        startTransition(() => action(data));
      }}
    >
      {children}
    </form>
  );
}


const CONTROL =
  "mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink-3 focus:border-navy focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal disabled:bg-paper disabled:text-ink-3";

function Label({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-signal"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = false,
  defaultValue,
  hint,
  placeholder,
  step,
  inputMode,
  mono,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  hint?: string;
  placeholder?: string;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  mono?: boolean;
}) {
  return (
    <Label label={label} required={required} hint={hint}>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        step={step}
        inputMode={inputMode}
        className={`${CONTROL} ${mono ? "font-mono" : ""}`}
      />
    </Label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required = false,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Label label={label} required={required} hint={hint}>
      <select name={name} required={required} defaultValue={defaultValue ?? ""} className={CONTROL}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Label label={label} hint={hint}>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? undefined} placeholder={placeholder} className={CONTROL} />
    </Label>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[#c2410c]" />
      <span>
        <span className="text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-3">{hint}</span>}
      </span>
    </label>
  );
}

/** Bloque de formulario con título, en grilla responsive. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-rule [&:not(:first-of-type)]:border-t [&:not(:first-of-type)]:pt-5">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-md font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  full = true,
  name,
  value,
  pending: pendingProp,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "quiet";
  full?: boolean;
  name?: string;
  value?: string;
  /** Con ActionForm, el estado de envío viene de useActionState. */
  pending?: boolean;
  /** Deshabilitado sin cambiar el texto (p. ej. mientras otro botón del mismo formulario envía). */
  disabled?: boolean;
}) {
  const status = useFormStatus();
  // Con varios botones en un formulario, solo el que se pulsó muestra «Guardando…».
  const clicked = !name || !status.data || status.data.get(name) === value;
  const pending = pendingProp ?? (status.pending && clicked);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled || status.pending}
      className={`${buttonClass(variant)} ${full ? "w-full" : ""} disabled:cursor-progress disabled:opacity-70`}
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
