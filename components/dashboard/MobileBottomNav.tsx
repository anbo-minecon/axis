// components/dashboard/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Plus,
  ClipboardList,
  BarChart2,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/grupo",      label: "Mi Grupo",   icon: Users },
  { href: "/dashboard/simulacros", label: "Simulacros", icon: ClipboardList },
  { href: "/dashboard/resultados", label: "Resultados", icon: BarChart2 },
];

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:hidden">
      <div className="flex items-center h-16">

        {/* Primeros 2 items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
                active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Botón + central — abre el drawer del sidebar */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={onOpenMenu}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white shadow-lg shadow-blue-600/40 dark:shadow-blue-950/40 transition active:scale-95 hover:bg-blue-700 dark:hover:bg-blue-600"
            aria-label="Abrir menú"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Últimos 2 items */}
        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
                active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}