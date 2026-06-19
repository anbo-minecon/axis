// components/dashboard/DashboardSidebar.tsx
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
  TrendingUp,
  Trophy,
  BookOpen,
  MessageSquare,
  Bell,
  Moon,
  Sun,
  LogOut,
  X,
  ChevronRight,
  AlertCircle,
  GraduationCap,
  UserCircle,
} from "lucide-react";

/* ── Tipos ── */
export interface SidebarUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  tieneSubscripcion: boolean;
  grupoId?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  premium?: boolean;
}

interface DashboardSidebarProps {
  user: SidebarUser;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Rutas ── */
const NAV_MAIN: NavItem[] = [
  { href: "/dashboard",              label: "Dashboard",           icon: LayoutDashboard },
  { href: "/dashboard/grupo",        label: "Mi Grupo",            icon: Users },
  { href: "/dashboard/simulacros",   label: "Simulacros",          icon: ClipboardList, premium: true },
  { href: "/dashboard/resultados",   label: "Resultados",          icon: BarChart2,     premium: true },
  { href: "/dashboard/estadisticas", label: "Estadísticas",        icon: TrendingUp,    premium: true },
  { href: "/dashboard/ranking",      label: "Ranking",             icon: Trophy },
  { href: "/dashboard/material",     label: "Material de Estudio", icon: BookOpen },
  { href: "/dashboard/mensajes",     label: "Mensajes",            icon: MessageSquare, premium: true },
  { href: "/dashboard/classroom",    label: "Classroom",           icon: GraduationCap,  premium: true },
];

const NAV_BOTTOM: NavItem[] = [
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/dashboard/perfil",         label: "Mi Perfil",      icon: UserCircle },
];

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

/* ── Botón de tema reutilizable ── */
function ThemeButton({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    // Versión solo ícono para el drawer móvil si se quisiera
    return (
      <button
        onClick={toggleTheme}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-white/10 transition"
      >
        {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] shrink-0" />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" />
      )}
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

/* ── NavLink desktop ── */
function NavLinkDesktop({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-white/20 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
    </Link>
  );
}

/* ── NavLink móvil (grid 2 cols) ── */
function NavLinkMobile({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-white/20 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/* ── Sidebar desktop content ── */
function SidebarDesktop({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "linear-gradient(180deg, #1a56db 0%, #1e40af 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4">
        <Image
          src="/images/logo2.png"
          alt="AXIS Logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white tracking-wide">AXIS</p>
          <p className="text-[11px] text-blue-200 font-medium">Pre-ICFES</p>
        </div>
      </div>

      {/* Usuario */}
      <div className="mx-4 mb-5 rounded-xl bg-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white leading-tight">{user.name}</p>
            <p className="text-xs text-blue-200 mt-0.5">Estudiante</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", user.tieneSubscripcion ? "bg-green-400" : "bg-red-400")} />
          <span className={cn("text-xs font-medium", user.tieneSubscripcion ? "text-green-300" : "text-red-300")}>
            {user.tieneSubscripcion ? "Activo" : "Sin suscripción"}
          </span>
        </div>
        {!user.grupoId && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-2.5 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="text-xs text-amber-200 font-medium">Sin grupo asignado</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {NAV_MAIN.map((item) => (
          <NavLinkDesktop key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Inferior */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <NavLinkDesktop key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {/* ✅ Botón de tema funcional */}
        <ThemeButton />

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

/* ── Drawer móvil (sheet desde abajo) ── */
function MobileDrawer({ user, onClose }: { user: SidebarUser; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/30" />
        </div>

        {/* Usuario + cerrar */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-400 text-sm font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-xs text-blue-200">Estudiante</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav grid 2 cols */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_MAIN.map((item) => (
              <NavLinkMobile
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </div>
        </div>

        <div className="mx-4 my-2 h-px bg-white/10" />

        <div className="px-4 pb-2">
          {NAV_BOTTOM.map((item) => (
            <NavLinkMobile
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <div className="mx-4 my-1 h-px bg-white/10" />

        <div className="px-4 pb-6 space-y-1">
          {/* ✅ Botón de tema funcional en el drawer móvil */}
          <ThemeButton compact />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Export principal ── */
export function DashboardSidebar({ user, isOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <SidebarDesktop user={user} />
      </aside>

      {isOpen && (
        <div className="lg:hidden">
          <MobileDrawer user={user} onClose={onClose} />
        </div>
      )}
    </>
  );
}