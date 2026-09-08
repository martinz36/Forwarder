"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Ship, 
  Anchor
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Cotizaciones", href: "/quotations", icon: FileText },
  { name: "Operaciones", href: "/operations", icon: Ship },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
          <Anchor className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight tracking-wide text-white">Forwarder ERP</h1>
          <p className="text-xs text-slate-400">Agencia de Aduanas Perú</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Sistema Aduanero & Logistics</p>
        <p className="mt-0.5">v1.0.0 • Production</p>
      </div>
    </aside>
  );
}
