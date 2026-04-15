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
      className="p-2 rounded-lg transition-all duration-300 bg-white/10 text-white hover:bg-white/20 active:bg-white/30"
      aria-label="Cambiar tema"
      title={`Cambiar a modo ${currentTheme === "light" ? "oscuro" : "claro"}`}
    >
      {currentTheme === "light" ? (
        <Moon width={20} height={20} />
      ) : (
        <Sun width={20} height={20} />
      )}
    </button>
  );
}
