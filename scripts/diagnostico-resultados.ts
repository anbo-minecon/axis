import { db } from "@/lib/db";

async function main() {
  const resultados = await db.resultadoSimulacro.findMany({
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } },
      examen: { select: { id: true, nombre: true, materia: true, estado: true } },
    },
  });

  console.log(`Total resultados: ${resultados.length}`);
  for (const r of resultados) {
    console.log(`- id=${r.id}`);
    console.log(`  estudianteId=${r.estudianteId} nombre=${r.estudiante?.nombre} email=${r.estudiante?.email}`);
    console.log(`  examenId=${r.examenId} nombre=${r.examen?.nombre} materia=${r.examen?.materia}`);
    console.log(`  estadoCalif=${r.estadoCalif} puntaje=${r.puntaje}/${r.total} preliminar=${r.puntajePreliminar} tri=${r.puntajeTRI}`);
    console.log(`  completadoEn=${r.completadoEn.toISOString()}`);
  }

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});