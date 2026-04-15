import { IconUsers, IconClock, IconCheck, IconStats } from "@/components/icons";

export function ImpactStats() {
  const stats = [
    {
      numero: "15,000+",
      label: "Horas de estudio",
      icon: IconClock,
    },
    {
      numero: "500+",
      label: "Estudiantes activos",
      icon: IconUsers,
    },
    {
      numero: "4.8★",
      label: "Calificación promedio",
      icon: IconCheck,
    },
    {
      numero: "120+",
      label: "Simulacros completados",
      icon: IconStats,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 dark:from-blue-900 to-blue-700 dark:to-blue-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Nuestro Impacto</h2>
          <p className="text-xl text-blue-100 dark:text-blue-200">Números que hablan de nuestro compromiso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center text-white">
              <div className="text-blue-200 dark:text-blue-300 mb-4 flex justify-center">
                <stat.icon width={40} height={40} />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.numero}</div>
              <p className="text-blue-100 dark:text-blue-200 text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
