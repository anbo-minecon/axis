import { IconStar } from "@/components/icons";

export function Testimonials() {
  const testimonials = [
    {
      nombre: "María Rodríguez",
      rol: "Estudiante, Bogotá",
      texto: "Aumenté mi puntaje de 430 a 530 con AXIS. Los simulacros y el análisis detallado fueron clave.",
      puntaje: 530,
      mejora: "+100",
    },
    {
      nombre: "Carlos López",
      rol: "Estudiante, Medellín",
      texto: "El ranking competitivo me motivó a seguir mejorando. Ahora estoy entre los top 100.",
      puntaje: 540,
      mejora: "+95",
    },
    {
      nombre: "Ana Martínez",
      rol: "Docente de Matemáticas",
      texto: "AXIS es excelente para que mis estudiantes practiquen de forma independiente y me permite dar mejor seguimiento.",
      puntaje: "5/5",
      mejora: "Recomendación",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros usuarios</h2>
          <p className="text-xl text-gray-600">Historias de éxito de estudiantes y docentes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} width={16} height={16} className="text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.texto}"</p>
              
              <div className="pt-6 border-t border-gray-200">
                <p className="font-bold text-gray-900">{testimonial.nombre}</p>
                <p className="text-sm text-gray-600 mb-3">{testimonial.rol}</p>
                <div className="text-sm">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {testimonial.puntaje} {testimonial.mejora}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
