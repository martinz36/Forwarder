import { requireTenant } from "@/server/tenant";
import { signOutAction } from "../(auth)/actions";
import { SideNav, TopNav } from "@/components/nav";
import { ROLE } from "@/lib/labels";

function Brand({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-signal font-mono text-sm font-medium text-white">
        F
      </span>
      <span className="truncate font-semibold tracking-tight text-white">{name}</span>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, role } = await requireTenant();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-navy px-3 py-5 lg:flex">
        <div className="px-2">
          <Brand name={organization.name} />
        </div>
        <div className="mt-8 flex-1">
          <SideNav />
        </div>
        <div className="border-t border-white/10 px-2 pt-4 text-sm">
          <p className="truncate font-medium text-white">{user.name}</p>
          <p className="truncate text-white/60">{ROLE[role]}</p>
          <form action={signOutAction} className="mt-3">
            <button className="text-white/70 underline-offset-4 hover:text-white hover:underline">Salir</button>
          </form>
        </div>
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-10 bg-navy px-4 pt-3 lg:hidden">
        <div className="flex items-center justify-between gap-3 pb-1">
          <Brand name={organization.name} />
          <form action={signOutAction}>
            <button className="text-sm text-white/70">Salir</button>
          </form>
        </div>
        <TopNav />
      </header>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
