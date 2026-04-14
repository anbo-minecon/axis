// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos...");

  // Crear planes
  const planes = [
    {
      nombre: "Básico",
      descripcion: "Plan gratuito con acceso limitado",
      precio: 0,
      duracionDias: 365,
      simulacrosMax: 2,
      caracteristicas: [
        "2 simulacros por mes",
        "Acceso a documentos básicos",
        "Visualización de ranking",
      ],
    },
    {
      nombre: "Pro",
      descripcion: "Plan profesional para estudiantes dedicados",
      precio: 29990,
      duracionDias: 90,
      simulacrosMax: -1,
      caracteristicas: [
        "Simulacros ilimitados",
        "Acceso a todos los materiales",
        "Análisis detallado de resultados",
        "Grupo de estudio privado",
        "Reportes semanales",
      ],
    },
    {
      nombre: "Premium",
      descripcion: "Plan premium con todas las ventajas",
      precio: 49990,
      duracionDias: 180,
      simulacrosMax: -1,
      caracteristicas: [
        "Simulacros ilimitados",
        "Todo incluido en Pro",
        "Mentoría 1 a 1 con expertos",
        "Acceso prioritario a nuevas funciones",
        "Descuentos en otros servicios",
      ],
    },
    {
      nombre: "Institucional",
      descripcion: "Plan para colegios e instituciones",
      precio: 199990,
      duracionDias: 365,
      simulacrosMax: -1,
      caracteristicas: [
        "Acceso ilimitado para grupo",
        "Dashboard de reportes de institución",
        "Soporte dedicado",
        "Personalización de contenido",
      ],
    },
  ];

  for (const planData of planes) {
    const planExistente = await db.plan.findUnique({
      where: { nombre: planData.nombre },
    });

    if (planExistente) {
      console.log(`✅ Plan "${planData.nombre}" ya existe`);
    } else {
      const plan = await db.plan.create({
        data: planData,
      });
      console.log(`✨ Plan "${plan.nombre}" creado`);
    }
  }

  // Crear áreas de conocimiento (para banco de preguntas)
  const areas = [
    {
      nombre: "Matemáticas",
      descripcion: "Álgebra, Geometría, Cálculo",
      color: "#3B82F6",
      icono: "calculate",
    },
    {
      nombre: "Lectura Crítica",
      descripcion: "Comprensión de textos y análisis",
      color: "#8B5CF6",
      icono: "book",
    },
    {
      nombre: "Ciencias Naturales",
      descripcion: "Biología, Química, Física",
      color: "#10B981",
      icono: "beaker",
    },
    {
      nombre: "Sociales",
      descripcion: "Historia, Geografía, Política",
      color: "#F59E0B",
      icono: "globe",
    },
    {
      nombre: "Inglés",
      descripcion: "Reading and Listening Comprehension",
      color: "#EC4899",
      icono: "translation",
    },
  ];

  for (const areaData of areas) {
    const areaExistente = await db.area.findUnique({
      where: { nombre: areaData.nombre },
    });

    if (areaExistente) {
      console.log(`✅ Área "${areaData.nombre}" ya existe`);
    } else {
      const area = await db.area.create({
        data: areaData,
      });
      console.log(`✨ Área "${area.nombre}" creada`);
    }
  }

  console.log("✅ Seed completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
