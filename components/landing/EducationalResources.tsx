import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function EducationalResources() {
  const resources = [
    {
      title: "Guían ICFES Oficial",
      description: "Descarga la guía oficial del ministerio con preguntas de años anteriores",
      icon: "book",
      type: "PDF",
    },
    {
      title: "Flashcards Interactivas",
      description: "Repasa conceptos clave con nuestro sistema de flashcards adaptativo",
      icon: "plan",
      type: "Interactivo",
    },
    {
      title: "Videos Explicativos",
      description: "Videotutoriales de cada área con docentes especializados",
      icon: "message",
      type: "Video",
    },
    {
      title: "Formularios y Tablas",
      description: "Acceso a formularios matemáticos, tablas periódicas y referencias",
      icon: "analytics",
      type: "Referencia",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Recursos Educativos</h2>
          <p className="text-xl text-gray-600">Material de apoyo completo para tu preparación</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">
                <FeatureIcon type={resource.icon} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                {resource.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
