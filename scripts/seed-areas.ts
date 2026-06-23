// scripts/seed-planes.ts
// Crea (o actualiza) los planes de suscripción base.
// Correr apuntando a la DATABASE_URL de producción (Neon).

import { db } from "@/lib/db";

async function main() {
  console.log("🌱 Creando planes de suscripción...\n");

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

  for (const p of planes) {
    const plan = await db.plan.upsert({
      where: { nombre: p.nombre },
      update: {
        descripcion: p.descripcion,
        precio: p.precio,
        duracionDias: p.duracionDias,
        simulacrosMax: p.simulacrosMax,
        caracteristicas: p.caracteristicas,
        activo: true,
      },
      create: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        duracionDias: p.duracionDias,
        simulacrosMax: p.simulacrosMax,
        caracteristicas: p.caracteristicas,
        activo: true,
      },
    });

    console.log(`✅ ${plan.nombre.padEnd(14)} -> $${plan.precio} / ${plan.duracionDias} días`);
  }

  console.log("\n🚀 Planes creados/actualizados correctamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });