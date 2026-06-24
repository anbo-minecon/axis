// app/api/dashboard/estadisticas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const resultados = await (db as any).resultadoSimulacro.findMany({
      where: { estudianteId: session.user.id },
      include: {
        examen: {
          select: {
            nombre:        true,
            materia:       true,
            tiempoMin:     true,
            tieneSesiones: true,
            estado:        true,
          },
        },
      },
      orderBy: { completadoEn: "asc" },
    });

    if (resultados.length === 0)
      return NextResponse.json({ sinDatos: true });

    // ── Helper: puntaje efectivo (TRI oficial si existe, preliminar si no) ──
    const puntajeEfectivo = (r: any): number => {
      if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
        return Number(r.puntajeTRI);
      return r.puntajePreliminar ?? (r.total > 0 ? (r.puntaje / r.total) * 100 : 0);
    };

    const pctEfectivo = (r: any): number => {
      const ef = puntajeEfectivo(r);
      // puntajePreliminar y puntajeTRI ya están en escala 0-100
      return Math.min(100, Math.max(0, ef));
    };

    // ── Métricas globales ─────────────────────────────────────────────────
    const porcentajes    = resultados.map(pctEfectivo);
    const promedioGlobal = porcentajes.reduce((a: number, b: number) => a + b, 0) / porcentajes.length;
    const mejorPct       = Math.max(...porcentajes);
    const peorPct        = Math.min(...porcentajes);
    const tiempoTotal    = resultados.reduce((a: number, r: any) => a + (r.tiempoUsado ?? 0), 0);
    const oficiales      = resultados.filter((r: any) => r.estadoCalif === "OFICIAL").length;

    // Tendencia entre primera y segunda mitad
    const mitad      = Math.floor(resultados.length / 2);
    const primera    = resultados.slice(0, mitad || 1).map(pctEfectivo);
    const segunda    = resultados.slice(mitad).map(pctEfectivo);
    const avgPrimera = primera.reduce((a: number, b: number) => a + b, 0) / primera.length;
    const avgSegunda = segunda.reduce((a: number, b: number) => a + b, 0) / segunda.length;
    const tendencia  = resultados.length < 2
      ? 0
      : Math.round((avgSegunda - avgPrimera) * 10) / 10;

    // ── Por materia ───────────────────────────────────────────────────────
    const porMateria: Record<string, {
      pcts: number[]; tiempos: number[]; oficiales: number;
    }> = {};

    const porArea: Record<string, { pcts: number[]; oficiales: number }> = {};

    for (const r of resultados) {
      const m = r.examen.materia;
      if (!porMateria[m]) porMateria[m] = { pcts: [], tiempos: [], oficiales: 0 };
      porMateria[m].pcts.push(pctEfectivo(r));
      porMateria[m].tiempos.push(r.tiempoUsado ?? 0);
      if (r.estadoCalif === "OFICIAL") porMateria[m].oficiales++;

      const puntajePorArea = r.puntajePorArea
        ? typeof r.puntajePorArea === "string"
          ? JSON.parse(r.puntajePorArea)
          : r.puntajePorArea
        : null;

      if (puntajePorArea) {
        for (const [area, puntaje] of Object.entries(puntajePorArea)) {
          if (!porArea[area]) porArea[area] = { pcts: [], oficiales: 0 };
          porArea[area].pcts.push(Number(puntaje));
          if (r.estadoCalif === "OFICIAL") porArea[area].oficiales++;
        }
      }
    }

    const materias = Object.entries(porMateria)
      .map(([materia, { pcts, tiempos, oficiales }]) => {
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return {
          materia,
          cantidad:        pcts.length,
          promedioPorc:    Math.round(avg),
          puntajeEscalado: Math.round((avg / 100) * 500),
          mejorPorc:       Math.round(Math.max(...pcts)),
          peorPorc:        Math.round(Math.min(...pcts)),
          tiempoPromedio:  Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length),
          oficiales,
        };
      })
      .sort((a, b) => b.promedioPorc - a.promedioPorc);

    const areas = Object.entries(porArea)
      .map(([area, { pcts, oficiales }]) => {
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return {
          area,
          cantidad:       pcts.length,
          promedio:       Math.round(avg),
          mejor:          Math.round(Math.max(...pcts)),
          peor:           Math.round(Math.min(...pcts)),
          oficiales,
        };
      })
      .sort((a, b) => b.promedio - a.promedio);

    // ── Progresión cronológica (para gráfica de línea) ────────────────────
    const progresion = resultados.map((r: any) => ({
      nombre:       r.examen.nombre,
      materia:      r.examen.materia,
      pct:          Math.round(pctEfectivo(r)),
      puntaje:      r.puntaje,
      total:        r.total,
      puntajeTRI:   r.puntajeTRI,
      estadoCalif:  r.estadoCalif,
      tiempoUsado:  r.tiempoUsado ?? 0,
      completadoEn: r.completadoEn,
    }));

    // ── Mejor y peor ──────────────────────────────────────────────────────
    const sorted   = [...resultados].sort((a: any, b: any) => pctEfectivo(b) - pctEfectivo(a));
    const mejorRes = sorted[0];
    const peorRes  = sorted[sorted.length - 1];

    return NextResponse.json({
      sinDatos: false,
      global: {
        totalSimulacros:  resultados.length,
        oficiales,
        promedioPorc:     Math.round(promedioGlobal),
        puntajeEscalado:  Math.round((promedioGlobal / 100) * 500),
        mejorPct:         Math.round(mejorPct),
        peorPct:          Math.round(peorPct),
        tiempoTotal,
        tendencia,
      },
      materias,
      areas,
      progresion,
      mejorSimulacro: {
        nombre:  mejorRes.examen.nombre,
        materia: mejorRes.examen.materia,
        pct:     Math.round(pctEfectivo(mejorRes)),
        estadoCalif: mejorRes.estadoCalif,
      },
      peorSimulacro: {
        nombre:  peorRes.examen.nombre,
        materia: peorRes.examen.materia,
        pct:     Math.round(pctEfectivo(peorRes)),
        estadoCalif: peorRes.estadoCalif,
      },
    });
  } catch (error) {
    console.error("[GET /api/dashboard/estadisticas]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}