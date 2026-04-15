// components/shared/SessionProvider.tsx
"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </NextAuthProvider>
  );
}