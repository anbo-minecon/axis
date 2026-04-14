import { AreaIcon } from "@/components/icons/AreaIcon";

export function AreasICFES() {
  const areas = [
    { nombre: "Matemáticas", icon: "math" as const, color: "#8b5cf6", pct: 88 },
    { nombre: "Lectura Crítica", icon: "lectura" as const, color: "#06b6d4", pct: 92 },
    { nombre: "Ciencias Naturales", icon: "ciencias" as const, color: "#10b981", pct: 85 },
    { nombre: "Sociales", icon: "sociales" as const, color: "#f59e0b", pct: 90 },
    { nombre: "Inglés", icon: "ingles" as const, color: "#ef4444", pct: 78 },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Todas las materias ICFES</h2>
          <p className="text-xl text-gray-600">Cobertura completa de las 5 áreas del examen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {areas.map((area) => (
            <div
              key={area.nombre}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <AreaIcon icon={area.icon} color={area.color} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{area.nombre}</h3>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium text-xs uppercase tracking-wide">Preparación</span>
                  <span className="font-bold" style={{ color: area.color }}>{area.pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${area.pct}%`, backgroundColor: area.color }}
                  ></div>
                </div>
              </div>

              <button
                className="mt-6 w-full py-2 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: area.color,
                  color: "white",
                }}
              >
                Practicar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AreaCard({ area }: { area: { nombre: string; icon: string; color: string; pct: number } }) {
  const iconMap: Record<string, React.FC<any>> = {
    IconMatematicas: require("@/components/icons").IconMatematicas,
    IconLectura: require("@/components/icons").IconLectura,
    IconCiencias: require("@/components/icons").IconCiencias,
    IconSociales: require("@/components/icons").IconSociales,
    IconIngles: require("@/components/icons").IconIngles,
  };

  const IconComponent = iconMap[area.icon];

  return (
    <div
      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="mb-4" style={{ color: area.color }}>
        {IconComponent && <IconComponent width={40} height={40} />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{area.nombre}</h3>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Progreso</span>
          <span className="font-bold" style={{ color: area.color }}>{area.pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${area.pct}%`, backgroundColor: area.color }}
          ></div>
        </div>
      </div>

      <button
        className="mt-6 w-full py-2 rounded-lg font-semibold transition-all"
        style={{
          backgroundColor: area.color,
          color: "white",
        }}
      >
        Practicar
      </button>
    </div>
  );
}
