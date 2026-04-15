"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader, Eye, EyeOff, MapPin } from "lucide-react";
import { Toast } from "@/lib/notifications";
import { trpc } from "@/lib/trpc-client";

interface Departamento {
  id: number;
  name: string;
  municipalities: Municipio[];
}

interface Municipio {
  id: number;
  name: string;
}

export default function RegistroPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    email: "",
    telefono: "",
    departamento: "",
    municipio: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const response = await fetch("https://api-colombia.com/api/v1/Department");
        const data = await response.json();
        setDepartamentos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading departments:", error);
        Toast.warning(
          "Aviso",
          "No se pudieron cargar los departamentos. Puedes continuar igual."
        );
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartamentos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu nombre completo");
      return;
    }

    if (!formData.documento.trim()) {
      Toast.error(
        "Campo requerido",
        "Por favor ingresa tu documento de identidad"
      );
      return;
    }

    if (!formData.email.trim()) {
      Toast.error("Campo requerido", "Por favor ingresa tu correo electrónico");
      return;
    }

    if (!formData.password) {
      Toast.error("Campo requerido", "Por favor ingresa una contraseña");
      return;
    }

    if (formData.password.length < 8) {
      Toast.error(
        "Contraseña débil",
        "La contraseña debe tener al menos 8 caracteres"
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Toast.error(
        "Contraseñas no coinciden",
        "Las contraseñas ingresadas no son iguales"
      );
      return;
    }

    if (!formData.acceptTerms) {
      Toast.error(
        "Términos requeridos",
        "Debes aceptar los términos y condiciones"
      );
      return;
    }

    setLoading(true);
    const loadingToast = Toast.loading(
      "Creando tu cuenta...",
      "Por favor espera"
    );

    try {
      // Llamar al backend tRPC
      const result = await trpc.auth.registro.mutate({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        colegio: undefined,
        grado: undefined,
        ciudad: formData.municipio.trim() || undefined,
      });

      if (result.success) {
        Toast.close(loadingToast);
        Toast.success(
          "¡Cuenta creada!",
          "Redirigiendo al inicio de sesión..."
        );

        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        Toast.close(loadingToast);
        Toast.error("Error", result.message || "No se pudo crear la cuenta");
        setLoading(false);
      }
    } catch (error: any) {
      Toast.close(loadingToast);
      const errorMessage =
        error?.message || "Ocurrió un error al crear la cuenta";
      Toast.error("Error de registro", errorMessage);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-950 to-blue-100 dark:to-gray-900 py-12 px-4 transition-colors duration-300">
      <div className="w-full max-w-2xl mx-auto">
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
            Crea tu cuenta
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Únete a miles de estudiantes preparándose para el ICFES
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl p-8 space-y-6 transition-colors duration-300"
        >
          {/* Row 1: Nombre y Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                Nombre completo *
              </label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez García"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label
                htmlFor="documento"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                Documento de identidad *
              </label>
              <input
                id="documento"
                type="text"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                placeholder="1023456789"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Row 2: Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
            >
              Correo electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Row 3: Teléfono */}
          <div>
            <label
              htmlFor="telefono"
              className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
            >
              Teléfono de contacto
            </label>
            <input
              id="telefono"
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="3001234567"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-axis-azul focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={loading}
            />
          </div>

          {/* Row 4: Ubicación */}
          <div className="bg-blue-50 dark:bg-gray-750 rounded-xl p-6 space-y-4 border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-blue-900 dark:text-white">Ubicación del estudiante</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departamento */}
              <div>
                <label htmlFor="departamento" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Departamento *
                </label>
                <select
                  id="departamento"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loadingDepts}
                  required
                >
                  <option value="" className="text-gray-500 dark:text-gray-400">
                    {loadingDepts ? "Cargando..." : "Selecciona un departamento"}
                  </option>
                  {Array.isArray(departamentos) &&
                    departamentos.map((dept) => (
                      <option key={dept.id} value={dept.id} className="text-gray-900 dark:text-gray-100">
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Municipio */}
              <div>
                <label htmlFor="municipio" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Municipio *
                </label>
                <input
                  id="municipio"
                  type="text"
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleChange}
                  placeholder="Ej: Bogotá, Medellín"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 5: Contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M15.171 13.576l1.414 1.414A1 1 0 0016 13.414v-1.828a2 2 0 10-4 0v1.414l1.172 1.172a4 4 0 01-2.268.642h-.004a4 4 0 01-3.59-2.066A4 4 0 0010 5c1.242 0 2.393.287 3.423.832z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M15.171 13.576l1.414 1.414A1 1 0 0016 13.414v-1.828a2 2 0 10-4 0v1.414l1.172 1.172a4 4 0 01-2.268.642h-.004a4 4 0 01-3.59-2.066A4 4 0 0010 5c1.242 0 2.393.287 3.423.832z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="acceptTerms"
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="w-4 h-4 mt-1 rounded border-gray-300 dark:border-gray-700 text-blue-600"
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-300">
              Acepto los{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                términos y condiciones
              </a>{" "}
              y la política de privacidad de AXIS Pre-ICFES.
            </label>
          </div>

          {/* Alert */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4 flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Tu cuenta iniciará sin suscripción activa. Deberás contactar al equipo AXIS para habilitar acceso a los simulacros.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || loadingDepts}
            className="w-full py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
