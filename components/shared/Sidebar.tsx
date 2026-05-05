// components/shared/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSuscripcion } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Trophy,
  Users,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiereSuscripcion?: boolean;
  badge?: boolean;
}

export function Sidebar({ ocultarMenuMobil = false }: { ocultarMenuMobil?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { tieneSubscripcion } = useSuscripcion();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Simulacros",
      href: "/dashboard/simulacro",
      icon: <Zap className="w-5 h-5" />,
      requiereSuscripcion: true,
    },
    {
      label: "Resultados",
      href: "/dashboard/resultados",
      icon: <BarChart3 className="w-5 h-5" />,
      requiereSuscripcion: true,
    },
    {
      label: "Ranking",
      href: "/dashboard/ranking",
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      label: "Mi Grupo",
      href: "/dashboard/grupo",
      icon: <Users className="w-5 h-5" />,
      requiereSuscripcion: true,
    },
    {
      label: "Material de Estudio",
      href: "/dashboard/material",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "Notificaciones",
      href: "/dashboard/notificaciones",
      icon: <Bell className="w-5 h-5" />,
      badge: true,
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  return (
    <>
      {/* Hamburger menu para mobile - solo si no está oculto */}
      {!ocultarMenuMobil && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-axis-azul rounded-lg"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-axis-azul to-axis-azul-dark text-white transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/logo.png" 
              alt="AXIS Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="font-bold text-lg">AXIS</h1>
              <p className="text-xs text-white/70">Pre-ICFES</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/perfil")}
            className="mt-4 w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            <p className="font-semibold text-sm">{session.user.name}</p>
            <p className="text-xs text-white/70">{session.user.email}</p>
          </button>
        </div>

        {/* Estado de Suscripción */}
        <div className="mx-4 mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
            {!tieneSubscripcion ? (
              <div className="text-center">
                <p className="text-xs text-white/80 mb-2">Sin suscripción</p>
                <button
                  onClick={() => router.push("/dashboard/planes")}
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold py-2 rounded-lg hover:from-orange-500 hover:to-orange-600 transition"
                >
                  Ver Planes
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-white/80 mb-1">Plan Activo</p>
                <p className="text-sm font-bold text-green-400">
                  ✓ Acceso Completo
                </p>
              </div>
            )}
          </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const bloqueado = item.requiereSuscripcion && !tieneSubscripcion;

              return (
                <Link
                  key={item.href}
                  href={bloqueado ? "#" : item.href}
                  onClick={(e) => {
                    if (bloqueado) {
                      e.preventDefault();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium text-sm",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                    bloqueado && "opacity-50 cursor-not-allowed"
                  )}
                  title={bloqueado ? "Necesitas un plan pagado" : ""}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      3
                    </span>
                  )}
                  {bloqueado && <span className="text-xs">🔒</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="border-t border-white/20 p-4 space-y-2">
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg">
            <ThemeToggle />
            <span className="text-white/80 font-medium text-sm flex-1">Cambiar tema</span>
          </div>

          <button
            onClick={() => router.push("/dashboard/perfil")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition font-medium text-sm"
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
