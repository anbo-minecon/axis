import { db } from "@/lib/db";

async function main() {
  const userId = "cmq6zqkal0009129vl0k2nb85";

  const resultados = await (db as any).resultadoSimulacro.findMany({
    where: { estudianteId: userId, estadoCalif: { in: ["OFICIAL", "PRELIMINAR"] } },
    include: {
      examen: {
        select: { nombre: true, materia: true, totalPreguntas: true },
      },
    },
    orderBy: { completadoEn: "desc" },
  });

  const recalcularPreliminar = (aciertos: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round(Math.pow(aciertos / total, 1.5) * 100);
  };

  const calcularPuntajeEfectivo = (r: any) => {
    if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
      return Math.round(Number(r.puntajeTRI));
    if ((r.puntajePreliminar ?? 0) > 0)
      return Math.round(r.puntajePreliminar ?? 0);
    if ((r.aciertos ?? 0) > 0 && (r.total ?? 0) > 0)
      return recalcularPreliminar(r.aciertos, r.total);
    const proporcion = r.total > 0 ? (r.puntaje ?? 0) / r.total : 0;
    return Math.round(proporcion * 100);
  };

  const resultadosConPuntaje = resultados.map((r: any) => ({
    ...r,
    porcentaje: calcularPuntajeEfectivo(r),
    puntajeEscalado: Math.round((calcularPuntajeEfectivo(r) / 100) * 500),
  }));

  const oficialesConPuntaje = resultadosConPuntaje.filter((r: any) => r.estadoCalif === "OFICIAL");
  const datosParaEstadisticas = oficialesConPuntaje.length ? oficialesConPuntaje : resultadosConPuntaje;

  const puntajeMasAlto = datosParaEstadisticas.length
    ? Math.max(...datosParaEstadisticas.map((r: any) => r.puntajeEscalado))
    : 0;

  const promedioGeneral = datosParaEstadisticas.length
    ? Math.round(
        datosParaEstadisticas.reduce((sum: number, r: any) => sum + r.puntajeEscalado, 0) /
          datosParaEstadisticas.length
      )
    : 0;

  const rendimientoMateria = Object.entries(
    datosParaEstadisticas.reduce((acc: Record<string, { sum: number; count: number }>, r: any) => {
      const materia = r.examen?.materia ?? "Multi-materia";
      if (!acc[materia]) acc[materia] = { sum: 0, count: 0 };
      acc[materia].sum += r.porcentaje;
      acc[materia].count += 1;
      return acc;
    }, {})
  ).map(([materia, data]: [string, any]) => ({
    materia,
    porcentaje: Math.round(data.sum / data.count),
  }));

  console.log({
    count: resultados.length,
    resultadosConPuntaje,
    puntajeMasAlto,
    promedioGeneral,
    rendimientoMateria,
  });

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});