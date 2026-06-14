"use client";

// components/auth/GoogleLoginButton.tsx
// Botón de login con Google para agregar a /auth/login
// Uso: <GoogleLoginButton callbackUrl="/dashboard" />

import { signIn } from "next-auth/react";
import { useState } from "react";

interface GoogleLoginButtonProps {
  callbackUrl?: string;
  label?: string;
}

export function GoogleLoginButton({
  callbackUrl = "/dashboard",
  label = "Continuar con Google",
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      type="button"
      className="
        flex w-full items-center justify-center gap-3
        rounded-xl border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        px-4 py-3
        text-sm font-medium text-gray-700 dark:text-gray-200
        shadow-sm
        transition-all duration-200
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:shadow-md
        active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      {loading ? (
        // Spinner
        <svg
          className="h-5 w-5 animate-spin text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        // Logo de Google SVG (no requiere dependencias externas)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>{loading ? "Conectando..." : label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CÓMO USAR en tu página de login (/app/auth/login/page.tsx):
//
// import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
//
// Dentro del JSX del formulario, agrega:
//
//   {/* Separador */}
//   <div className="relative my-6">
//     <div className="absolute inset-0 flex items-center">
//       <div className="w-full border-t border-gray-200 dark:border-gray-700" />
//     </div>
//     <div className="relative flex justify-center text-sm">
//       <span className="bg-white dark:bg-gray-900 px-3 text-gray-400">o continúa con</span>
//     </div>
//   </div>
//
//   <GoogleLoginButton callbackUrl="/dashboard" />
// ─────────────────────────────────────────────────────────────────────────────