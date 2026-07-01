// scripts/check-session-questions.ts
// Script para verificar qué preguntas pertenecen a cada sesión

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🔍 Verificando preguntas por sesión...\n');

  // Obtener simulacros recientes con sesiones
  const examenes = await (db as any).examenTemplate.findMany({
    where: { tieneSesiones: true },
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (examenes.length === 0) {
    console.log('❌ No se encontraron simulacros con sesiones');
    await db.$disconnect();
    return;
  }

  const examenId = examenes[0].id;
  console.log(`📊 Analizando simulacro: ${examenes[0].nombre} (ID: ${examenId})\n`);

  const sesiones = await (db as any).sesionExamen.findMany({
    where: { examenId },
    orderBy: { numero: 'asc' },
  });

  for (const sesion of sesiones) {
    console.log(`📌 Sesión ${sesion.numero}: ${sesion.nombre}`);
    
    const claves = await (db as any).claveExamen.findMany({
      where: {
        examenId,
        sesionId: sesion.id,
      },
      select: {
        numeroPregunta: true,
        area: true,
      },
      orderBy: { numeroPregunta: 'asc' },
    });

    if (claves.length === 0) {
      console.log('   (Sin preguntas)\n');
      continue;
    }

    const primeraPregunta = claves[0].numeroPregunta;
    const ultimaPregunta = claves[claves.length - 1].numeroPregunta;
    
    console.log(`   Rango: ${primeraPregunta} - ${ultimaPregunta} (${claves.length} preguntas)`);
    
    const areasUnicas = new Set(claves.map((c: any) => c.area).filter(Boolean));
    console.log(`   Áreas: ${Array.from(areasUnicas).join(', ')}`);
    
    // Verificar si hay inglés
    const inglesPreguntas = claves.filter((c: any) => c.area === "INGLES");
    if (inglesPreguntas.length > 0) {
      console.log(`   🇬🇧 Preguntas de inglés: ${inglesPreguntas.length}`);
    }
    
    console.log('');
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
