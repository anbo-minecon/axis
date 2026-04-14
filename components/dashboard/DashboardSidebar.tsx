// components/dashboard/DashboardSidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
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
  LogOut,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";

/* ── Tipos ───────────────────────────────────────── */
export interface SidebarUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  tieneSubscripcion: boolean;
  grupoId?: string | null; // null = sin grupo asignado
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  premium?: boolean;
}

interface DashboardSidebarProps {
  user: SidebarUser;
  isOpen: boolean;           // controla el drawer móvil
  onClose: () => void;
}

/* ── Definición de rutas ─────────────────────────── */
const NAV_MAIN: NavItem[] = [
  { href: "/dashboard",               label: "Dashboard",          icon: LayoutDashboard },
  { href: "/dashboard/grupo",         label: "Mi Grupo",           icon: Users },
  { href: "/dashboard/simulacros",    label: "Simulacros",         icon: ClipboardList, premium: true },
  { href: "/dashboard/resultados",    label: "Resultados",         icon: BarChart2,     premium: true },
  { href: "/dashboard/estadisticas",  label: "Estadísticas",       icon: TrendingUp,    premium: true },
  { href: "/dashboard/ranking",       label: "Ranking",            icon: Trophy },
  { href: "/dashboard/material",      label: "Material de Estudio",icon: BookOpen },
  { href: "/dashboard/mensajes",      label: "Mensajes",           icon: MessageSquare, premium: true },
];

const NAV_BOTTOM: NavItem[] = [
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell },
];

/* ── Helpers ─────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Componente item de navegación ───────────────── */
function NavLink({
  item,
  active,
  locked,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  if (locked) {
    return (
      <span
        title="Requiere suscripción activa"
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-200/50 transition select-none"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <Lock className="h-3 w-3 shrink-0 opacity-60" />
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
        active
          ? "bg-white/15 font-medium text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      )}
    </Link>
  );
}

/* ── Sidebar interno (compartido desktop/móvil) ──── */
function SidebarContent({
  user,
  onClose,
  isMobile = false,
}: {
  user: SidebarUser;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  return (
    <div className="flex h-full flex-col bg-blue-900 text-white">
      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold">
            AX
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">AXIS</p>
            <p className="text-xs text-blue-300">Pre-ICFES</p>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Usuario ── */}
      <div className="mx-3 mb-4 rounded-xl bg-blue-800/60 p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
            {getInitials(user.name)}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none">
              {user.name}
            </p>
            <p className="mt-0.5 text-xs text-blue-300">Estudiante</p>
          </div>
        </div>

        {/* Estado suscripción */}
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              user.tieneSubscripcion ? "bg-green-400" : "bg-amber-400"
            )}
          />
          <span
            className={cn(
              "text-xs",
              user.tieneSubscripcion ? "text-green-300" : "text-amber-300"
            )}
          >
            {user.tieneSubscripcion ? "Activo" : "Sin suscripción"}
          </span>
        </div>

        {/* Advertencia sin grupo */}
        {!user.grupoId && user.tieneSubscripcion && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2 py-1">
            <AlertCircle className="h-3 w-3 shrink-0 text-amber-300" />
            <span className="text-xs text-amber-200">Sin grupo asignado</span>
          </div>
        )}
      </div>

      {/* ── Navegación principal ── */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              locked={!!(item.premium && !user.tieneSubscripcion)}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </div>
      </nav>

      {/* ── Navegación inferior ── */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="space-y-0.5">
          {NAV_BOTTOM.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              locked={false}
              onClick={isMobile ? onClose : undefined}
            />
          ))}

          {/* Modo oscuro (placeholder — implementar según preferencia) */}
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 transition hover:bg-white/10 hover:text-white">
            <Moon className="h-4 w-4 shrink-0" />
            <span>Modo oscuro</span>
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal exportado ──────────────── */
export function DashboardSidebar({ user, isOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      {/* ── Desktop: sidebar fijo ── */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <SidebarContent user={user} />
      </aside>

      {/* ── Móvil: overlay + drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <SidebarContent user={user} onClose={onClose} isMobile />
          </div>
        </div>
      )}
    </>
  );
}