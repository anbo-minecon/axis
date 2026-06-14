// components/dashboard/DashboardShell.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { DashboardSidebar, type SidebarUser } from "./DashboardSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface DashboardShellProps {
  user: SidebarUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar desktop fijo (solo lg+) */}
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header móvil: SOLO logo, sin ningún botón */}
        <header className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 lg:hidden">
          <Image
            src="/images/logo2.png"
            alt="AXIS Logo"
            width={24}
            height={24}
            className="rounded-md"
          />
          <div className="leading-tight">
            <p className="text-[11px] font-extrabold text-gray-900 dark:text-white tracking-wide">AXIS</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">Pre-ICFES</p>
          </div>
        </header>

        {/* Contenido — pb-20 para no quedar bajo el bottom nav */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav: solo visible en móvil, el + central abre el drawer */}
        <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}