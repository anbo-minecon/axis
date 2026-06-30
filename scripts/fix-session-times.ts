// scripts/fix-session-times.ts
// Script para corregir los tiempos de las sesiones existentes en la base de datos
// Este script divide el tiempo total simulacro entre el número de sesiones

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Iniciando corrección de tiempos de sesiones...\n');

  // Obtener todos los exámenes que tienen sesiones
  const examenes = await prisma.examenTemplate.findMany({
    where: {
      tieneSesiones: true,
    },
    include: {
      sesiones: {
        orderBy: { numero: 'asc' },
      },
    },
  });

  console.log(`📊 Se encontraron ${examenes.length} exámenes con sesiones\n`);

  let actualizados = 0;
  let sinCambios = 0;

  for (const examen of examenes) {
    const tiempoTotal = examen.tiempoMin;
    const numSesiones = examen.sesiones.length;
    
    if (numSesiones === 0) {
      console.log(`⚠️  Examen "${examen.nombre}" no tiene sesiones, saltando...`);
      continue;
    }

    // Calcular tiempo por sesión
    const tiempoPorSesion = Math.floor(tiempoTotal / numSesiones);
    
    console.log(`📝 Examen: "${examen.nombre}"`);
    console.log(`   Tiempo total: ${tiempoTotal} min`);
    console.log(`   Sesiones: ${numSesiones}`);
    console.log(`   Tiempo por sesión: ${tiempoPorSesion} min`);

    // Verificar si alguna sesión necesita actualización
    const necesitaActualizacion = examen.sesiones.some(
      (s) => s.tiempoMin !== tiempoPorSesion
    );

    if (!necesitaActualizacion) {
      console.log(`   ✅ Ya tiene tiempos correctos, sin cambios\n`);
      sinCambios++;
      continue;
    }

    // Actualizar cada sesión
    for (const sesion of examen.sesiones) {
      await prisma.sesionExamen.update({
        where: { id: sesion.id },
        data: { tiempoMin: tiempoPorSesion },
      });
      console.log(`   ✏️  Sesión ${sesion.numero}: ${sesion.tiempoMin} → ${tiempoPorSesion} min`);
    }

    console.log(`   ✅ Actualizado\n`);
    actualizados++;
  }

  console.log('\n📋 Resumen:');
  console.log(`   ✅ Exámenes actualizados: ${actualizados}`);
  console.log(`   ℹ️  Exámenes sin cambios: ${sinCambios}`);
  console.log('\n✨ Corrección completada!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la corrección:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
