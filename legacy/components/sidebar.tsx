"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Ship,
  Anchor,
  Folder,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { MarivanLogo } from "@/components/ui/marivan-logo";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expedientes", href: "/expedients", icon: Folder },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Productos / Servicios", href: "/services", icon: Tag },
  { name: "Cotizaciones", href: "/quotations", icon: FileText },
  { name: "Operaciones", href: "/operations", icon: Ship },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Read saved collapse preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  // Close mobile drawer on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Hide sidebar completely on public portal pages
  if (pathname.startsWith("/portal") || pathname.startsWith("/shared")) {
    return null;
  }

  return (
    <>
      {/* Mobile Sticky Top Navigation Bar (Visible on screens < md) */}
      <div className="md:hidden flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 text-white shrink-0 z-40">
        <MarivanLogo variant="white" size="sm" />

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Desktop & Mobile Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out md:static md:z-auto",
          // Mobile responsive drawer positioning
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          // Desktop collapse widths
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        {/* Brand Header & Toggle Button */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-800 px-4 transition-all",
            isCollapsed ? "justify-center md:px-2" : "justify-between"
          )}
        >
          <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "md:hidden")}>
            <MarivanLogo variant="white" size="sm" />
          </div>

          {/* Icon-only header logo when collapsed on desktop */}
          {isCollapsed && (
            <div className="hidden md:flex">
              <MarivanLogo variant="icon" size="sm" />
            </div>
          )}

          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={cn(
              "hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-xs shrink-0",
              isCollapsed && "mt-2"
            )}
            title={isCollapsed ? "Expandir Menú (Ganar Visibilidad)" : "Colapsar Menú (Ganar Espacio)"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span className={cn("truncate transition-opacity duration-200", isCollapsed && "md:hidden")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Secondary Collapse Action */}
        <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-300 truncate">Marivan Logistics SAC</p>
                <p className="mt-0.5 text-[11px] truncate">Sistema Aduanero & Logístico</p>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex justify-center text-center text-[10px] font-mono text-slate-500" title="Marivan Logistics SAC">
              ERP
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
