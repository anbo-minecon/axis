// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

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

  // ─── CREAR USUARIOS DE PRUEBA (uno de cada rol) ───

  const passwordHash = await hash("Password123", 10);
  const planProFound = await db.plan.findUnique({ where: { nombre: "Pro" } });

  // Estudiante
  const estudiante = await db.usuario.upsert({
    where: { email: "estudiante@axis.local" },
    update: {},
    create: {
      email: "estudiante@axis.local",
      nombre: "Juan Estudiante",
      rol: "ESTUDIANTE",
      passwordHash,
      emailVerified: new Date(),
      documento: "1234567890",
      telefono: "3001234567",
      colegio: "Colegio Técnico Central",
      grado: 11,
      ciudad: "Bogotá",
    },
  });
  console.log(`✨ Estudiante creado: ${estudiante.email}`);

  // Asignar plan Pro al estudiante
  if (planProFound) {
    const suscripcion = await db.suscripcion.upsert({
      where: { usuarioId: estudiante.id },
      update: {},
      create: {
        usuarioId: estudiante.id,
        planId: planProFound.id,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
        activa: true,
      },
    });
    console.log(`✨ Suscripción Pro asignada a estudiante`);
  }

  // Docente
  const docente = await db.usuario.upsert({
    where: { email: "docente@axis.local" },
    update: {},
    create: {
      email: "docente@axis.local",
      nombre: "María Docente",
      rol: "DOCENTE",
      passwordHash,
      emailVerified: new Date(),
      documento: "0987654321",
      telefono: "3009876543",
      ciudad: "Bogotá",
    },
  });
  console.log(`✨ Docente creado: ${docente.email}`);

  // Admin
  const admin = await db.usuario.upsert({
    where: { email: "admin@axis.local" },
    update: {},
    create: {
      email: "admin@axis.local",
      nombre: "Carlos Admin",
      rol: "ADMIN",
      passwordHash,
      emailVerified: new Date(),
      documento: "1111111111",
      telefono: "3001111111",
      ciudad: "Bogotá",
    },
  });
  console.log(`✨ Admin creado: ${admin.email}`);

  console.log("\n📋 Usuarios de prueba creados:");
  console.log(`   Estudiante: estudiante@axis.local / Password123`);
  console.log(`   Docente:    docente@axis.local / Password123`);
  console.log(`   Admin:      admin@axis.local / Password123`);
  console.log(`   Developer:  Crear con: npx tsx scripts/setup-developer.ts\n`);

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
