// app/auth/registro/registro-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import { AlertCircle, Mail, Lock, User, Loader } from "lucide-react";

export function RegistroForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    colegio: "",
    grado: "",
    ciudad: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resultado = await trpc.auth.registro.mutate({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        colegio: formData.colegio,
        grado: formData.grado ? parseInt(formData.grado) : undefined,
        ciudad: formData.ciudad,
      });

      // Redirect a login
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-red-900">{error}</p>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Completo
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          />
        </div>
      </div>

      {/* Colegio y Grado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colegio
          </label>
          <input
            type="text"
            name="colegio"
            value={formData.colegio}
            onChange={handleChange}
            placeholder="Tu colegio"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grado
          </label>
          <select
            name="grado"
            value={formData.grado}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          >
            <option value="">Selecciona grado</option>
            <option value="9">9°</option>
            <option value="10">10°</option>
            <option value="11">11°</option>
          </select>
        </div>
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ciudad
        </label>
        <input
          type="text"
          name="ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          placeholder="Tu ciudad"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition"
            disabled={loading}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-axis-azul to-axis-azul-dark text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Registrando...
          </>
        ) : (
          "Crear Cuenta"
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        Al registrarte, aceptas nuestros{" "}
        <a href="#" className="text-axis-azul hover:underline">
          términos de servicio
        </a>
      </p>

      {/* Login Link */}
      <p className="mt-4 text-center text-gray-600 text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-axis-azul hover:text-axis-azul-dark transition"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
