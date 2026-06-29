// scripts/diagnostico-usuario-v4.ts
// Ejecutar con: npx tsx scripts/diagnostico-usuario-v4.ts
import { db } from "@/lib/db";

const ESTUDIANTE_ID = "cmq6zqkal00009129v10k2nb85"; // ID correcto (con el 0 que faltaba)

async function main() {
  const resultados = await (db as any).resultadoSimulacro.findMany({
    where: { estudianteId: ESTUDIANTE_ID },
    include: { examen: { select: { nombre: true, estado: true, triCalculado: true } } },
  });

  console.log(`Encontrados: ${resultados.length}`);
  console.table(resultados.map((r: any) => ({
    id: r.id,
    examen: r.examen?.nombre,
    estadoExamen: r.examen?.estado,
    triCalculado: r.examen?.triCalculado,
    estadoCalif: r.estadoCalif,
    puntaje: `${r.puntaje}/${r.total}`,
    preliminar: r.puntajePreliminar,
    tri: r.puntajeTRI,
  })));
}

main().finally(() => process.exit());