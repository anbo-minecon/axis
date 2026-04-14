import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function Caracteristicas() {
  const features = [
    {
      icon: "simulacros",
      title: "Simulacros realistas",
      description: "Practica con exámenes diseñados según la estructura actual del ICFES",
    },
    {
      icon: "analytics",
      title: "Análisis detallado",
      description: "Revisa tu desempeño por área, tema y tipo de pregunta",
    },
    {
      icon: "rankings",
      title: "Ranking nacional",
      description: "Compite con otros estudiantes y monitorea tu progreso",
    },
    {
      icon: "book",
      title: "Materiales de estudio",
      description: "Accede a guías, resúmenes y recursos complementarios",
    },
    {
      icon: "progress",
      title: "Seguimiento personalizado",
      description: "Identifica temas débiles y recibe recomendaciones",
    },
    {
      icon: "message",
      title: "Soporte continuo",
      description: "Comunícate con tutores y resuelve tus dudas",
    },
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Características principales</h2>
          <p className="text-xl text-gray-600">Todo lo que necesitas para prepararte exitosamente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-8 shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className="mb-4 text-blue-600">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
