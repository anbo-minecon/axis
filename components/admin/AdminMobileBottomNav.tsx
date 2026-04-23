// components/admin/AdminMobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, BadgeCheck, BarChart3, Plus } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard",     label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios",      label: "Usuarios",  icon: Users },
  { href: "/admin/suscripciones", label: "Suscrip.",  icon: BadgeCheck },
  { href: "/admin/reportes",      label: "Reportes",  icon: BarChart3 },
];

interface AdminMobileBottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
}

export function AdminMobileBottomNav({ onOpenMenu, isMenuOpen = false }: AdminMobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin/dashboard" || pathname === "/admin"
      : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:hidden">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative",
                active ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-purple-600 dark:bg-purple-400" />
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-700 dark:bg-purple-600 text-white shadow-lg shadow-purple-700/40 transition active:scale-95 hover:bg-purple-800"
          >
            <Plus
              className={cn(
                "h-6 w-6 stroke-[2.5] transition-transform duration-300",
                isMenuOpen && "rotate-45"
              )}
            />
          </button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative",
                active ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-purple-600 dark:bg-purple-400" />
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