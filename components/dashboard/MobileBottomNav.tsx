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
import { useSuscripcion } from "@/hooks/useUser";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/grupo",      label: "Mi Grupo",    icon: Users },
  { href: "/dashboard/simulacros", label: "Simulacros",  icon: ClipboardList, premium: true },
  { href: "/dashboard/resultados", label: "Resultados",  icon: BarChart2, premium: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { tieneSubscripcion } = useSuscripcion();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex items-center">
        {/* Primeros 2 items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition",
                active ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Botón central + */}
        <div className="flex flex-1 flex-col items-center py-2">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg shadow-blue-700/40 transition hover:bg-blue-800">
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Últimos 2 items */}
        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const locked = item.premium && !tieneSubscripcion;
          return (
            <Link
              key={item.href}
              href={locked ? "/dashboard" : item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition",
                active ? "text-blue-700" : "text-gray-500 hover:text-gray-700",
                locked && "opacity-40"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}