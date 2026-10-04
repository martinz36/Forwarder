export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-sm bg-navy font-mono text-sm font-medium text-white">
            F
          </span>
          <span className="text-md font-semibold tracking-tight text-navy">Forwarder</span>
        </div>
        {children}
      </div>
    </main>
  );
}
