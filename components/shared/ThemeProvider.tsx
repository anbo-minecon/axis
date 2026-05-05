"use client";

import { createContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isMounted, setIsMounted] = useState(false);

  // Función para aplicar el tema al DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    const htmlElement = document.documentElement;
    
    if (newTheme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
    
    // Log para debugging
    console.log("🎨 Tema aplicado:", newTheme, "Clases HTML:", htmlElement.className);
  }, []);

  // Inicializar el tema en el cliente
  useEffect(() => {
    setIsMounted(true);

    // Obtener tema del localStorage o detectar preferencia del sistema
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  // Función para cambiar el tema
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      
      // Guardar en localStorage
      localStorage.setItem("theme", newTheme);
      
      // Aplicar al DOM
      applyTheme(newTheme);
      
      return newTheme;
    });
  }, [applyTheme]);

  // Siempre proveer el contexto, incluso antes de montar
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
