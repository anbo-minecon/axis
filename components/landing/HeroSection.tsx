import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 overflow-hidden pt-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="text-white space-y-8 z-10">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
              Prepárate para el<br />
              <span className="text-yellow-300">Saber 11</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-lg">
              La plataforma digital que transforma la preparación para el examen ICFES. Simulacros, estadísticas, y seguimiento personalizado en un solo lugar.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
              <div className="text-3xl font-bold text-yellow-300">500+</div>
              <div className="text-sm text-blue-100 mt-1">Estudiantes</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
              <div className="text-3xl font-bold text-yellow-300">120+</div>
              <div className="text-sm text-blue-100 mt-1">Simulacros</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
              <div className="text-3xl font-bold text-yellow-300">5</div>
              <div className="text-sm text-blue-100 mt-1">Materias</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/auth/registro"
              className="inline-flex items-center justify-center px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-lg"
            >
              Comenzar ahora →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white bg-opacity-20 text-white font-bold rounded-lg hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Right - Hero Image */}
        <div className="relative h-96 lg:h-full hidden lg:block z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl opacity-20"></div>
          <div className="relative h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl overflow-hidden">
            <Image
              src="/images/hero-students.jpeg"
              alt="Estudiantes preparándose"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Floating card */}
          <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-2xl p-6 max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-semibold text-sm">¡Simulacro completado!</span>
            </div>
            <p className="text-gray-800 font-bold mb-1">Tu puntaje: 450/500</p>
            <p className="text-gray-500 text-sm">Mejora 12% respecto al anterior</p>
          </div>
        </div>
      </div>
    </section>
  );
}
