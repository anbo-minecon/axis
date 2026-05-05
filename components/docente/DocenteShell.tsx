// components/docente/DocenteShell.tsx
"use client";

import { useState } from "react";
import { DocenteSidebar, type DocenteUser } from "./DocenteSidebar";
import { Plus, LayoutDashboard, Users, ClipboardList, BarChart2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DocenteShellProps {
  user: DocenteUser;
  children: React.ReactNode;
  estudiantesSinGrupo?: number;
}

// Bottom nav móvil para docente
const MOBILE_NAV = [
  { href: "/docente/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/docente/grupos",     label: "Grupos",    icon: Users },
  { href: "/docente/simulacros", label: "Simul.",    icon: ClipboardList },
  { href: "/docente/estadisticas", label: "Stats",   icon: BarChart2 },
];

function DocenteMobileBottomNav({
  onOpenMenu,
  isMenuOpen = false,
}: {
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/docente/dashboard"
      ? pathname === "/docente/dashboard" || pathname === "/docente"
      : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:hidden">
      <div className="flex items-stretch h-16">
        {MOBILE_NAV.slice(0, 2).map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative",
                active ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-green-600 dark:bg-green-400" />
              )}
              <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Botón + central */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={onOpenMenu}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 dark:bg-green-600 text-white shadow-lg shadow-green-700/40 transition active:scale-95 hover:bg-green-800"
          >
            <Plus
              className={cn(
                "h-6 w-6 stroke-[2.5] transition-transform duration-300",
                isMenuOpen && "rotate-45"
              )}
            />
          </button>
        </div>

        {MOBILE_NAV.slice(2).map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative",
                active ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-green-600 dark:bg-green-400" />
              )}
              <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DocenteShell({ user, children, estudiantesSinGrupo = 0 }: DocenteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <DocenteSidebar
        user={user}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        estudiantesSinGrupo={estudiantesSinGrupo}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 lg:hidden">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-700 text-[10px] font-extrabold text-white shrink-0">
            AX
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-extrabold text-gray-900 dark:text-white tracking-wide">AXIS</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">Docente</p>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-16 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav móvil */}
        <DocenteMobileBottomNav
          onOpenMenu={() => setMenuOpen((v) => !v)}
          isMenuOpen={menuOpen}
        />
      </div>
    </div>
  );
}