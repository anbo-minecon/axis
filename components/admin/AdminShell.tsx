// components/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import { AdminSidebar, type AdminUser } from "./AdminSidebar";
import { AdminMobileBottomNav } from "./AdminMobileBottomNav";
import { AdminMobileMenu } from "./AdminMobileMenu";

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
  estudiantesSinGrupo?: number;
}

export function AdminShell({ user, children, estudiantesSinGrupo }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar — solo desktop */}
      <AdminSidebar
        user={user}
        estudiantesSinGrupo={estudiantesSinGrupo}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header móvil — solo logo, sin hamburguesa */}
        <header className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-700 text-xs font-bold text-white">
            AX
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">AXIS Admin</span>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-16 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav móvil */}
        <AdminMobileBottomNav
          onOpenMenu={() => setMenuOpen((v) => !v)}
          isMenuOpen={menuOpen}
        />

        {/* Menú overlay móvil (el del + ) */}
        <AdminMobileMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={user}
          estudiantesSinGrupo={estudiantesSinGrupo}
        />
      </div>
    </div>
  );
}