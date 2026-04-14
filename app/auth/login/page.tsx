"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Toast } from "@/lib/notifications";

export default function LoginPage() {
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-axis-azul to-axis-azul-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold text-2xl text-axis-azul">AXIS</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-base text-gray-700">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-3">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white text-gray-900 placeholder-gray-500"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-3">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white text-gray-900 placeholder-gray-500"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
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
                className="w-4 h-4 rounded border-gray-300 text-axis-azul focus:ring-axis-azul"
                disabled={loading}
              />
              <span className="text-gray-700 font-medium">Recuérdame</span>
            </label>
            <a 
              href="#" 
              className="text-axis-azul hover:text-axis-azul-dark font-semibold transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-axis-azul to-axis-azul-dark text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-8 text-center text-gray-700 font-medium">
          ¿No tienes cuenta?{" "}
          <Link 
            href="/auth/registro" 
            className="text-axis-azul hover:text-axis-azul-dark font-semibold transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
