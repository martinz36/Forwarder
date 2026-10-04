import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-ink-3">404</p>
      <h1 className="mt-2 text-lg font-semibold">No encontramos esa página</h1>
      <Link href="/" className="mt-6 text-sm font-medium text-navy underline underline-offset-4">
        Volver al panel
      </Link>
    </main>
  );
}
