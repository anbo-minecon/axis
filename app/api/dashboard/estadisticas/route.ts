// app/api/dashboard/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const resultados = await db.resultadoSimulacro.findMany({
      where: { estudianteId: session.user.id },
      include: {
        examen: { select: { nombre: true, materia: true, tiempoMin: true } },
      },
      orderBy: { completadoEn: "asc" },
    });

    if (resultados.length === 0) {
      return NextResponse.json({ sinDatos: true });
    }

    // ── Métricas globales ──────────────────────────────────────────────────
    const porcentajes  = resultados.map((r) => (r.puntaje / r.total) * 100);
    const promedioGlobal = porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length;
    const mejorPct     = Math.max(...porcentajes);
    const peorPct      = Math.min(...porcentajes);
    const tiempoTotal  = resultados.reduce((a, r) => a + r.tiempoUsado, 0);

    // Tendencia: diferencia entre segunda mitad y primera mitad
    const mitad   = Math.floor(resultados.length / 2);
    const primera = resultados.slice(0, mitad || 1).map((r) => (r.puntaje / r.total) * 100);
    const segunda = resultados.slice(mitad).map((r) => (r.puntaje / r.total) * 100);
    const avgPrimera = primera.reduce((a, b) => a + b, 0) / primera.length;
    const avgSegunda = segunda.reduce((a, b) => a + b, 0) / segunda.length;
    const tendencia  = resultados.length < 2 ? 0 : Math.round((avgSegunda - avgPrimera) * 10) / 10;

    // ── Por materia ────────────────────────────────────────────────────────
    const porMateria: Record<string, { pcts: number[]; tiempos: number[] }> = {};
    for (const r of resultados) {
      const m = r.examen.materia;
      if (!porMateria[m]) porMateria[m] = { pcts: [], tiempos: [] };
      porMateria[m].pcts.push((r.puntaje / r.total) * 100);
      porMateria[m].tiempos.push(r.tiempoUsado);
    }

    const materias = Object.entries(porMateria).map(([materia, { pcts, tiempos }]) => {
      const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
      return {
        materia,
        cantidad: pcts.length,
        promedioPorc: Math.round(avg),
        puntajeEscalado: Math.round((avg / 100) * 500),
        mejorPorc: Math.round(Math.max(...pcts)),
        tiempoPromedio: Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length),
      };
    }).sort((a, b) => b.promedioPorc - a.promedioPorc);

    // ── Progresión cronológica ─────────────────────────────────────────────
    const progresion = resultados.map((r) => ({
      nombre: r.examen.nombre,
      materia: r.examen.materia,
      pct: Math.round((r.puntaje / r.total) * 100),
      puntaje: r.puntaje,
      total: r.total,
      tiempoUsado: r.tiempoUsado,
      completadoEn: r.completadoEn,
    }));

    // ── Mejor y peor simulacro ─────────────────────────────────────────────
    const sorted    = [...resultados].sort((a, b) => (b.puntaje / b.total) - (a.puntaje / a.total));
    const mejorRes  = sorted[0];
    const peorRes   = sorted[sorted.length - 1];

    return NextResponse.json({
      sinDatos: false,
      global: {
        totalSimulacros: resultados.length,
        promedioPorc: Math.round(promedioGlobal),
        puntajeEscalado: Math.round((promedioGlobal / 100) * 500),
        mejorPct: Math.round(mejorPct),
        peorPct: Math.round(peorPct),
        tiempoTotal,             // segundos
        tendencia,               // positivo = mejora, negativo = baja
      },
      materias,
      progresion,
      mejorSimulacro: {
        nombre: mejorRes.examen.nombre,
        materia: mejorRes.examen.materia,
        pct: Math.round((mejorRes.puntaje / mejorRes.total) * 100),
        puntaje: mejorRes.puntaje,
        total: mejorRes.total,
      },
      peorSimulacro: {
        nombre: peorRes.examen.nombre,
        materia: peorRes.examen.materia,
        pct: Math.round((peorRes.puntaje / peorRes.total) * 100),
        puntaje: peorRes.puntaje,
        total: peorRes.total,
      },
    });
  } catch (error) {
    console.error("[GET /api/dashboard/estadisticas]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}