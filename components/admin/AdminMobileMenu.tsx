// components/admin/AdminMobileMenu.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  BadgeCheck,
  BarChart3,
  FileText,
  Megaphone,
  Moon,
  Sun,
  LogOut,
  AlertTriangle,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface AdminMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  estudiantesSinGrupo?: number;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard",     label: "Dashboard",            icon: LayoutDashboard },
  { href: "/admin/usuarios",      label: "Usuarios",             icon: Users },
  { href: "/admin/grupos",        label: "Grupos",               icon: UsersRound },
  { href: "/admin/suscripciones", label: "Suscripciones",        icon: BadgeCheck },
  { href: "/admin/simulacros",    label: "Simulacros",           icon: ClipboardList },
  { href: "/admin/mensajes",      label: "Mensajes",             icon: MessageSquare },
  { href: "/admin/reportes",      label: "Reportes",             icon: BarChart3 },
  { href: "/admin/contenido",     label: "Contenido",            icon: FileText },
  { href: "/admin/anuncios",      label: "Anuncios",             icon: Megaphone },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AdminMobileMenu({
  isOpen,
  onClose,
  user,
  estudiantesSinGrupo = 0,
}: AdminMobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin/dashboard" || pathname === "/admin"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    onClose();
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-16 left-3 right-3 z-50 lg:hidden rounded-2xl overflow-hidden shadow-2xl",
          "transition-all duration-300 origin-bottom",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        style={{ background: "linear-gradient(180deg, #5b21b6 0%, #4c1d95 100%)" }}
      >
        {/* Usuario */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-400 text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white leading-tight">{user.name}</p>
            <p className="text-xs text-purple-200">Administrador</p>
          </div>
        </div>

        {/* Alerta */}
        {estudiantesSinGrupo > 0 && (
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/20 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="text-xs font-semibold text-amber-200">
              {estudiantesSinGrupo} estudiantes sin grupo asignado.
            </span>
          </div>
        )}

        {/* Grid de navegación 2 columnas */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white/20 text-white"
                    : "text-purple-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Divisor */}
        <div className="mx-3 border-t border-white/10" />

        {/* Acciones inferiores */}
        <div className="grid grid-cols-2 gap-2 px-3 py-3">
          <button
            onClick={() => { toggleTheme(); }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-white/10 hover:text-white"
          >
            {isDark ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}