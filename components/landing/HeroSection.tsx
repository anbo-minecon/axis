import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 dark:from-gray-900 dark:via-blue-900 dark:to-gray-950 overflow-hidden pt-20 transition-colors duration-300">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white dark:bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300 dark:bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="text-white space-y-8 z-10">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
              Prepárate para el<br />
              <span className="text-yellow-300 dark:text-yellow-400">Saber 11</span>
            </h1>
            <p className="text-xl text-blue-100 dark:text-blue-200 max-w-lg">
              La plataforma digital que transforma la preparación para el examen ICFES. Simulacros, estadísticas, y seguimiento personalizado en un solo lugar.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 bg-opacity-10 dark:bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white dark:border-gray-700 border-opacity-20 dark:border-opacity-30">
              <div className="text-3xl font-bold text-yellow-300 dark:text-yellow-400">500+</div>
              <div className="text-sm text-blue-100 dark:text-blue-200 mt-1">Estudiantes</div>
            </div>
            <div className="bg-white dark:bg-gray-800 bg-opacity-10 dark:bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white dark:border-gray-700 border-opacity-20 dark:border-opacity-30">
              <div className="text-3xl font-bold text-yellow-300 dark:text-yellow-400">120+</div>
              <div className="text-sm text-blue-100 dark:text-blue-200 mt-1">Simulacros</div>
            </div>
            <div className="bg-white dark:bg-gray-800 bg-opacity-10 dark:bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white dark:border-gray-700 border-opacity-20 dark:border-opacity-30">
              <div className="text-3xl font-bold text-yellow-300 dark:text-yellow-400">5</div>
              <div className="text-sm text-blue-100 dark:text-blue-200 mt-1">Materias</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/auth/registro"
              className="inline-flex items-center justify-center px-8 py-4 bg-yellow-400 dark:bg-yellow-500 text-blue-900 dark:text-gray-950 font-bold rounded-lg hover:bg-yellow-300 dark:hover:bg-yellow-400 transition-colors shadow-lg"
            >
              Comenzar ahora →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-700 bg-opacity-20 dark:bg-opacity-30 text-white font-bold rounded-lg hover:bg-opacity-30 dark:hover:bg-opacity-40 transition-colors border border-white dark:border-gray-500 border-opacity-30 dark:border-opacity-40"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Right - Hero Image */}
        <div className="relative h-96 lg:h-full hidden lg:block z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 dark:from-blue-600 to-blue-600 dark:to-blue-900 rounded-3xl opacity-20"></div>
          <div className="relative h-full bg-gradient-to-br from-blue-400 dark:from-blue-600 to-blue-600 dark:to-blue-900 rounded-3xl overflow-hidden">
            <Image
              src="/images/hero-axis-pro.png"
              alt="Estudiantes preparándose"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Floating card */}
          <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">¡Simulacro completado!</span>
            </div>
            <p className="text-gray-800 dark:text-gray-100 font-bold mb-1">Tu puntaje: 450/500</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Mejora 12% respecto al anterior</p>
          </div>
        </div>
      </div>
    </section>
  );
}
