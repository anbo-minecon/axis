// scripts/check-english-areas.ts
// Script para verificar las áreas de preguntas en la base de datos

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🔍 Verificando áreas de preguntas...\n');

  // Obtener simulacros recientes con sesiones
  const examenes = await (db as any).examenTemplate.findMany({
    where: { tieneSesiones: true },
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('📋 Simulacros recientes con sesiones:');
  examenes.forEach((e: any) => {
    console.log(`   ID: ${e.id}, Nombre: ${e.nombre}`);
  });

  if (examenes.length === 0) {
    console.log('\n❌ No se encontraron simulacros con sesiones');
    await db.$disconnect();
    return;
  }

  // Usar el primer simulacro encontrado
  const examenId = examenes[0].id;
  console.log(`\n📊 Analizando simulacro: ${examenes[0].nombre} (ID: ${examenId})\n`);

  const claves = await (db as any).claveExamen.findMany({
    where: {
      examenId: examenId,
    },
    select: {
      numeroPregunta: true,
      area: true,
    },
    orderBy: { numeroPregunta: 'asc' },
  });

  console.log('Áreas de preguntas:');
  const areasUnicas = new Set<string>();
  claves.forEach((c: any) => {
    console.log(`   Pregunta ${c.numeroPregunta}: ${c.area || 'SIN AREA'}`);
    if (c.area) areasUnicas.add(c.area);
  });

  console.log('\n📌 Áreas únicas encontradas:');
  areasUnicas.forEach((area) => {
    console.log(`   - ${area}`);
  });

  // Verificar preguntas de inglés específicamente
  const inglesPreguntas = claves.filter((c: any) => c.area && c.area.toUpperCase().includes('ING'));
  console.log(`\n🇬🇧 Preguntas de inglés encontradas: ${inglesPreguntas.length}`);
  if (inglesPreguntas.length > 0) {
    console.log('   Números de preguntas de inglés:');
    inglesPreguntas.forEach((c: any) => {
      console.log(`   - Pregunta ${c.numeroPregunta}: "${c.area}"`);
    });
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
