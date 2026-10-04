"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Panel" },
  { href: "/expedientes", label: "Expedientes" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/clientes", label: "Clientes" },
  { href: "/configuracion", label: "Configuración" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra lateral (escritorio). */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`press rounded-sm px-3 py-2 text-base ${
              active ? "bg-white/12 font-medium text-white" : "text-white/70 hover:bg-white/6 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Pestañas horizontales (móvil). */
export function TopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex gap-1 whitespace-nowrap">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-2 px-2.5 py-2 text-sm ${
                  active ? "border-signal font-medium text-white" : "border-transparent text-white/70"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
