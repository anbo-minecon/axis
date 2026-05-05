"use client";

import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Si aún no está montado en el cliente, no renderizar nada
  if (!mounted) {
    return null;
  }

  return <ThemeToggleContent />;
}

function ThemeToggleContent() {
  const { theme, toggleTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    toggleTheme();
    setCurrentTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg transition-all duration-300 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 active:bg-gray-400 dark:active:bg-white/30"
      aria-label="Cambiar tema"
      title={`Cambiar a modo ${currentTheme === "light" ? "oscuro" : "claro"}`}
    >
      {currentTheme === "light" ? (
        <Moon width={20} height={20} className="text-gray-700" />
      ) : (
        <Sun width={20} height={20} className="text-white" />
      )}
    </button>
  );
}
