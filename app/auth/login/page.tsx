"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Toast } from "@/lib/notifications";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!email.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu correo electrónico");
      return;
    }

    if (!password.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);
    const loadingToast = Toast.loading("Iniciando sesión...", "Por favor espera");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        Toast.close(loadingToast);
        Toast.error(
          "Error de autenticación",
          result?.error || "Correo o contraseña incorrectos"
        );
        setLoading(false);
        return;
      }

      // Login exitoso
      Toast.close(loadingToast);
      Toast.success("¡Bienvenido!", "Redirigiendo al dashboard...");

      // Pequeño delay para que vea el toast
      setTimeout(() => {
        router.push(callbackUrl);
      }, 500);
    } catch (err) {
      Toast.close(loadingToast);
      Toast.error("Error inesperado", "Intenta de nuevo más tarde");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-950 to-blue-100 dark:to-gray-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center">
            <Image 
              src="/images/logo.png" 
              alt="AXIS Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-2xl text-axis-azul dark:text-blue-400">AXIS</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl p-8 space-y-6 transition-colors duration-300">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-axis-azul focus:ring-axis-azul bg-white dark:bg-gray-700"
                disabled={loading}
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Recuérdame</span>
            </label>
            <a 
              href="#" 
              className="text-axis-azul dark:text-blue-400 hover:text-axis-azul-dark dark:hover:text-blue-300 font-semibold transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-axis-azul to-axis-azul-dark dark:from-blue-600 dark:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg dark:hover:shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-8 text-center text-gray-700 dark:text-gray-300 font-medium">
          ¿No tienes cuenta?{" "}
          <Link 
            href="/auth/registro" 
            className="text-axis-azul dark:text-blue-400 hover:text-axis-azul-dark dark:hover:text-blue-300 font-semibold transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-300">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
