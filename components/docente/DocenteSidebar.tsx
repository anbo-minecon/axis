// components/docente/DocenteSidebar.tsx
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard, Users, ClipboardList,
  BookOpen, Megaphone, MessageSquare, BarChart2,
  Moon, Sun, LogOut, ChevronRight, X, AlertTriangle, UserCircle,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface DocenteUser {
  id:    string;
  name:  string;
  email: string;
  image?: string | null;
}

interface DocenteSidebarProps {
  user:                  DocenteUser;
  isOpen:                boolean;
  onClose:               () => void;
  estudiantesSinGrupo?:  number;
}

// ── Nav items — SIN crear ni importar simulacros ───────────────────────────
const NAV_ITEMS = [
  { href: "/docente/dashboard",    label: "Dashboard",           icon: LayoutDashboard },
  { href: "/docente/grupos",       label: "Mis Grupos",          icon: Users           },
  { href: "/docente/simulacros",   label: "Gestionar Simulacros",icon: ClipboardList   },
  { href: "/docente/material",     label: "Material Educativo",  icon: BookOpen        },
  { href: "/docente/anuncios",     label: "Anuncios",            icon: Megaphone       },
  { href: "/docente/mensajes",     label: "Mensajes",            icon: MessageSquare   },
  { href: "/docente/estadisticas", label: "Estadísticas",        icon: BarChart2       },
  { href: "/docente/perfil",       label: "Mi Perfil",           icon: UserCircle      },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/docente/dashboard")
    return pathname === "/docente/dashboard" || pathname === "/docente";
  return pathname.startsWith(href);
}

// ── Theme toggle ───────────────────────────────────────────────────────────
function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 transition hover:bg-white/10 hover:text-white"
    >
      {isDark
        ? <Sun  className="h-[18px] w-[18px] shrink-0" />
        : <Moon className="h-[18px] w-[18px] shrink-0" />}
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SIDEBAR DESKTOP
// ══════════════════════════════════════════════════════════════════════════
function SidebarDesktop({
  user,
  estudiantesSinGrupo = 0,
}: {
  user: DocenteUser;
  estudiantesSinGrupo?: number;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "linear-gradient(180deg, #166534 0%, #14532d 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Image src="/images/logo2.png" alt="AXIS" width={32} height={32} className="rounded-lg" />
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white tracking-wide">AXIS</p>
          <p className="text-[11px] text-green-200 font-medium">Pre-ICFES</p>
        </div>
      </div>

      {/* Usuario */}
      <div className="mx-3 mb-3 rounded-xl bg-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-400 text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white leading-tight">{user.name}</p>
            <p className="text-xs text-green-200 mt-0.5">Docente</p>
          </div>
        </div>
      </div>

      {/* Alerta estudiantes sin grupo */}
      {estudiantesSinGrupo > 0 && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/20 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="text-xs font-semibold text-amber-200">
            {estudiantesSinGrupo} estudiantes sin grupo
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActiveRoute(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/20 text-white"
                  : "text-green-100 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Inferior */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <ThemeButton />
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DRAWER MÓVIL
// ══════════════════════════════════════════════════════════════════════════
function MobileDrawer({
  user,
  onClose,
  estudiantesSinGrupo = 0,
}: {
  user: DocenteUser;
  onClose: () => void;
  estudiantesSinGrupo?: number;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleSignOut = async () => {
    onClose();
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, #166534 0%, #14532d 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/30" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-400 text-sm font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-xs text-green-200">Docente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {estudiantesSinGrupo > 0 && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/20 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="text-xs font-semibold text-amber-200">
              {estudiantesSinGrupo} estudiantes sin grupo
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white/20 text-white"
                    : "text-green-100 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mx-4 h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-1.5 px-4 py-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-white/10 transition"
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-red-500/20 hover:text-red-300 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function DocenteSidebar({
  user, isOpen, onClose, estudiantesSinGrupo = 0,
}: DocenteSidebarProps) {
  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block h-full">
        <SidebarDesktop user={user} estudiantesSinGrupo={estudiantesSinGrupo} />
      </aside>
      {isOpen && (
        <div className="lg:hidden">
          <MobileDrawer user={user} onClose={onClose} estudiantesSinGrupo={estudiantesSinGrupo} />
        </div>
      )}
    </>
  );
}