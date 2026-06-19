// components/admin/AdminSidebar.tsx
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard, Users, UsersRound, BadgeCheck, BarChart3,
  FileText, Megaphone, Moon, Sun, LogOut, ChevronRight,
  AlertTriangle, ClipboardList, MessageSquare, GraduationCap, UserCircle
} from "lucide-react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface AdminSidebarProps {
  user: AdminUser;
  estudiantesSinGrupo?: number;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard",     label: "Dashboard",             icon: LayoutDashboard },
  { href: "/admin/usuarios",      label: "Gestionar Usuarios",    icon: Users },
  { href: "/admin/grupos",        label: "Gestionar Grupos",      icon: UsersRound },
  { href: "/admin/suscripciones", label: "Validar Suscripciones", icon: BadgeCheck },
  { href: "/admin/simulacros",    label: "Simulacros",            icon: ClipboardList },
  { href: "/admin/mensajes",      label: "Mensajes",              icon: MessageSquare },
  { href: "/admin/reportes",      label: "Reportes del Sistema",  icon: BarChart3 },
  { href: "/admin/contenido",     label: "Gestionar Contenido",   icon: FileText },
  { href: "/admin/anuncios",      label: "Anuncios",              icon: Megaphone },
  { href: "/admin/classroom",     label: "Classroom",             icon: GraduationCap },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-white/10 hover:text-white"
    >
      {isDark ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

export function AdminSidebar({ user, estudiantesSinGrupo = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin/dashboard" || pathname === "/admin"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <aside
      className="hidden w-56 shrink-0 lg:flex flex-col h-full"
      style={{ background: "linear-gradient(180deg, #5b21b6 0%, #4c1d95 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Image
          src="/images/logo2.png"
          alt="AXIS Logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white tracking-wide">AXIS</p>
          <p className="text-[11px] text-purple-200 font-medium">Pre-ICFES</p>
        </div>
      </div>

      {/* Usuario */}
      <div className="mx-3 mb-4 rounded-xl bg-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-400 text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white leading-tight">{user.name}</p>
            <p className="text-xs text-purple-200 mt-0.5">Administrador</p>
          </div>
        </div>
      </div>

      {/* Alerta */}
      {estudiantesSinGrupo > 0 && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/20 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="text-xs font-semibold text-amber-200">{estudiantesSinGrupo} estudiantes sin grupo</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "bg-white/20 text-white" : "text-purple-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Inferior */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <Link
          href="/admin/perfil"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            isActive("/admin/perfil") ? "bg-white/20 text-white" : "text-purple-100 hover:bg-white/10 hover:text-white"
          )}
        >
          <UserCircle className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1">Mi Perfil</span>
        </Link>
        <ThemeButton />
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}