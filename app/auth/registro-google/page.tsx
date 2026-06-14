"use client";

import { useState, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, User, BookOpen, MapPin, Loader } from "lucide-react";
import { Toast } from "@/lib/notifications";

function RegistroGoogleContent() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [nombre, setNombre] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [colegio, setColegio] = useState("");
  const [grado, setGrado] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirigir si no hay sesión de Google
  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-950 to-blue-100 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">No hay sesión activa</p>
          <Link
            href="/auth/login"
            className="text-axis-azul dark:text-blue-400 hover:underline font-semibold"
          >
            Volver a login
          </Link>
        </div>
      </main>
    );
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-950 to-blue-100 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Cargando...</div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!nombre.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu nombre");
      return;
    }

    if (!email.trim()) {
      Toast.error("Campo requerido", "El email es requerido");
      return;
    }

    if (!telefono.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu número de celular");
      return;
    }

    if (!/^\d{7,}$/.test(telefono.replace(/\s|-/g, ""))) {
      Toast.error("Formato inválido", "El teléfono debe tener al menos 7 dígitos");
      return;
    }

    setLoading(true);
    const loadingToast = Toast.loading("Completando registro...", "Por favor espera");

    try {
      const response = await fetch("/api/auth/completar-registro-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          documento: documento.trim() || null,
          colegio: colegio.trim() || null,
          grado: grado ? parseInt(grado) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Toast.close(loadingToast);
        Toast.error("Error", data.error || "No se pudo completar el registro");
        setLoading(false);
        return;
      }

      Toast.close(loadingToast);
      Toast.success("¡Registro completado!", "Redirigiendo al dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      Toast.close(loadingToast);
      Toast.error("Error inesperado", "Intenta de nuevo más tarde");
      console.error(err);
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
            Completa tu perfil
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Necesitamos algunos datos adicionales para tu cuenta
          </p>
        </div>

        {/* Badge de Google */}
        <div className="bg-blue-50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-900 dark:text-white">Registrado con Google</p>
            <p className="text-gray-600 dark:text-gray-400">{email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl p-8 space-y-5 transition-colors duration-300">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email (solo lectura) */}
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
                readOnly
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Teléfono (requerido) */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Celular <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Documento (opcional) */}
          <div>
            <label htmlFor="documento" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Documento (opcional)
            </label>
            <input
              id="documento"
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Cédula, pasaporte, etc."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Colegio (opcional) */}
          <div>
            <label htmlFor="colegio" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Colegio (opcional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="colegio"
                type="text"
                value={colegio}
                onChange={(e) => setColegio(e.target.value)}
                placeholder="Nombre de tu colegio"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>
          </div>

          {/* Grado (opcional) */}
          <div>
            <label htmlFor="grado" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Grado (opcional)
            </label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select
                id="grado"
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="">Selecciona tu grado</option>
                <option value="10">10°</option>
                <option value="11">11°</option>
                <option value="12">12° (Egresado)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-axis-azul to-axis-azul-dark dark:from-blue-600 dark:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg dark:hover:shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? "Completando registro..." : "Completar registro"}
          </button>

          {/* Logout option */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            disabled={loading}
            className="w-full py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            Cambiar cuenta
          </button>
        </form>

        {/* Info */}
        <p className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          Los campos marcados con <span className="text-red-500">*</span> son obligatorios
        </p>
      </div>
    </main>
  );
}

export default function RegistroGooglePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-300">Cargando...</div>
      </div>
    }>
      <RegistroGoogleContent />
    </Suspense>
  );
}
