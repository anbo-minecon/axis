"use client";

import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/components/shared/ThemeProvider";

export function useTheme() {
  const context = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Retornar un valor por defecto mientras se monta
  if (!mounted || !context) {
    return {
      theme: "light" as const,
      toggleTheme: () => {},
    };
  }

  return context;
}
