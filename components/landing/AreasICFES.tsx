import { AreaIcon } from "@/components/icons/AreaIcon";

const AREAS = [
  { nombre: "Matemáticas", icon: "math" as const, color: "#8b5cf6", pct: 88 },
  { nombre: "Lectura Crítica", icon: "lectura" as const, color: "#06b6d4", pct: 92 },
  { nombre: "Naturales", icon: "ciencias" as const, color: "#10b981", pct: 85 },
  { nombre: "Sociales", icon: "sociales" as const, color: "#f59e0b", pct: 90 },
  { nombre: "Inglés", icon: "ingles" as const, color: "#ef4444", pct: 78 },
];

interface Area {
  nombre: string;
  icon: "math" | "lectura" | "ciencias" | "sociales" | "ingles";
  color: string;
  pct: number;
}

interface AreaCardProps {
  area: Area;
}

function AreaCard({ area }: AreaCardProps) {
  return (
    <div className="group relative">
      {/* Glow effect de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-gradient-to-br from-gray-50 dark:from-slate-800/80 to-gray-100 dark:to-slate-700/60 rounded-2xl p-8 border border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 backdrop-blur-sm">
        
        {/* Icono - en contenedor destacado */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gray-200 dark:bg-slate-700/50 group-hover:bg-gray-300 dark:group-hover:bg-slate-600/70 group-hover:scale-110 transition-all duration-300 border border-gray-300 dark:border-slate-600/50">
            <div className="w-12 h-12" style={{ color: area.color }}>
              <AreaIcon icon={area.icon} color={area.color} />
            </div>
          </div>
        </div>

        {/* Nombre del área */}
        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-6">
          {area.nombre}
        </h3>
        
        {/* Barra de progreso */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
              Preparación
            </span>
            <span className="text-sm font-bold" style={{ color: area.color }}>
              {area.pct}%
            </span>
          </div>
          
          <div className="w-full h-2.5 bg-gray-300 dark:bg-slate-600/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ 
                width: `${area.pct}%`, 
                backgroundColor: area.color,
                boxShadow: `0 0 12px ${area.color}55`
              }}
            />
          </div>
        </div>

        {/* Botón de acción */}
        <button
          className="mt-8 w-full py-2.5 rounded-lg font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
          style={{
            backgroundColor: area.color,
          }}
        >
          Practicar
        </button>
      </div>
    </div>
  );
}

export function AreasICFES() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Todas las materias <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">ICFES</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Cobertura completa de las 5 áreas del examen con contenido actualizado y simulacros especializados
          </p>
        </div>

        {/* Grid de áreas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-5">
          {AREAS.map((area) => (
            <AreaCard key={area.nombre} area={area} />
          ))}
        </div>

        {/* CTA adicional */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Accede a todos los materiales y comienza tu preparación hoy
          </p>
          <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300">
            Ver todos los cursos
          </button>
        </div>
      </div>
    </section>
  );
}
