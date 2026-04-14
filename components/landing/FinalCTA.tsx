import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          ¿Listo para mejorar tu puntaje?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Únete a miles de estudiantes que ya están prepárándose para el Saber 11 con AXIS Pre-ICFES
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/registro"
            className="inline-flex items-center justify-center px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-lg"
          >
            Crear mi cuenta gratis →
          </Link>
          <Link
            href="#planes"
            className="inline-flex items-center justify-center px-8 py-4 bg-white bg-opacity-20 text-white font-bold rounded-lg hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
          >
            Ver planes premium
          </Link>
        </div>

        <p className="text-blue-100 text-sm mt-8">
          No necesitas tarjeta de crédito para el plan básico
        </p>
      </div>
    </section>
  );
}
