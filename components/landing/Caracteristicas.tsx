import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function Caracteristicas() {
  const features = [
    {
      icon: "simulacros",
      title: "Simulacros tipo Saber 11",
      description: "Practica con exámenes diseñados según la estructura actual del ICFES",
    },
    {
      icon: "analytics",
      title: "Análisis detallado",
      description: "Revisa tu desempeño por área, tema y tipo de pregunta con estadísticas precisas",
    },
    {
      icon: "ranking",
      title: "Ranking nacional",
      description: "Compite con otros estudiantes y monitorea tu progreso en tiempo real",
    },
    {
      icon: "book",
      title: "Materiales de estudio",
      description: "Accede a guías, resúmenes, PDFs y recursos organizados por materia",
    },
    {
      icon: "progress",
      title: "Seguimiento personalizado",
      description: "Identifica temas débiles, recibe recomendaciones y visualiza tu mejora",
    },
    {
      icon: "message",
      title: "Soporte continuo",
      description: "Comunícate con tutores mediante mensajería integrada y resuelve tus dudas",
    },
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">¿Por qué elegir AXIS Pre-ICFES?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Todo lo que necesitas para una preparación efectiva</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all"
            >
              <div className="mb-4 text-blue-600 dark:text-blue-400">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
