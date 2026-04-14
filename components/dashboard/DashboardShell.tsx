// components/dashboard/DashboardShell.tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar, type SidebarUser } from "./DashboardSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface DashboardShellProps {
  user: SidebarUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar (desktop fijo / móvil drawer) */}
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white">
              AX
            </div>
            <span className="text-sm font-semibold text-gray-800">AXIS Pre-ICFES</span>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Nav inferior móvil */}
        <MobileBottomNav />
      </div>
    </div>
  );
}