// Script para debuggear estadísticas
import { db } from "@/lib/db";

async function debug() {
  try {
    // Obtener último usuario con sesión activa
    const usuarios = await db.usuario.findMany({
      take: 5,
      include: {
        suscripcion: true,
        resultados: {
          include: {
            examen: { select: { nombre: true, materia: true } }
          },
          take: 10,
        }
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n=== USUARIOS RECIENTES ===");
    for (const user of usuarios) {
      console.log(`\n👤 ${user.nombre} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Suscripción activa: ${user.suscripcion?.activa}`);
      console.log(`   Resultados: ${user.resultados.length}`);
      if (user.resultados.length > 0) {
        user.resultados.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.examen.nombre} (${r.examen.materia}) - ${r.puntaje}/${r.total}`);
        });
      }
    }

    // Estadísticas totales
    const totalResultados = await db.resultadoSimulacro.count();
    const totalUsuarios = await db.usuario.count();
    console.log(`\n📊 TOTALES`);
    console.log(`   Usuarios: ${totalUsuarios}`);
    console.log(`   Resultados de simulacros: ${totalResultados}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

debug();
