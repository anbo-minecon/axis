import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function WhyAXIS() {
  const features = [
    {
      icon: "simulacros",
      title: "Simulacros tipo Saber 11",
      description: "Practicar con simulacros estructurados igual al examen real ICFES",
    },
    {
      icon: "analytics",
      title: "Estadísticas detalladas",
      description: "Analiza tu desempeño por área, pregunta, y tipo de contenido",
    },
    {
      icon: "ranking",
      title: "Ranking competitivo",
      description: "Compite con otros estudiantes y ve tu posición nacional",
    },
    {
      icon: "book",
      title: "Material de estudio",
      description: "Accede a PDFs, flashcards y recursos organizados por materia",
    },
    {
      icon: "message",
      title: "Comunicación directa",
      description: "Mantén contacto con docentes mediante mensajería integrada",
    },
    {
      icon: "progress",
      title: "Seguimiento de progreso",
      description: "Visualiza tu mejora constante con gráficos interactivos",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Por qué AXIS Pre-ICFES?</h2>
          <p className="text-xl text-gray-600">Todo lo que necesitas para una preparación efectiva</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-blue-600 mb-4">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
