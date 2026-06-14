// app/api/admin/reportes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });
    if (usuario?.rol !== "ADMIN")
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const examenId = searchParams.get("examenId"); // opcional: filtrar por simulacro

    // ── 1. Métricas generales del sistema ─────────────────────────────────
    const [
      totalEstudiantes,
      totalSimulacros,
      totalResultados,
      resultadosOficiales,
    ] = await Promise.all([
      db.usuario.count({ where: { rol: "ESTUDIANTE" } }),
      (db as any).examenTemplate.count(),
      (db as any).resultadoSimulacro.count(),
      (db as any).resultadoSimulacro.count({ where: { estadoCalif: "OFICIAL" } }),
    ]);

    // ── 2. Simulacros por estado ───────────────────────────────────────────
    const simulacrosPorEstado = await (db as any).examenTemplate.groupBy({
      by: ["estado"],
      _count: { id: true },
    });

    const estadoMap: Record<string, number> = {};
    for (const s of simulacrosPorEstado) estadoMap[s.estado] = s._count.id;

    // ── 3. Todos los simulacros con métricas (o uno específico) ───────────
    const whereExamen = examenId ? { id: examenId } : {};

    const examenes = await (db as any).examenTemplate.findMany({
      where:   whereExamen,
      include: {
        _count:   { select: { claves: true, resultados: true } },
        sesiones: { select: { id: true, numero: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── 4. Resultados globales para estadísticas agregadas ────────────────
    const todosResultados = await (db as any).resultadoSimulacro.findMany({
      where: examenId ? { examenId } : {},
      select: {
        estudianteId:     true,
        examenId:         true,
        puntaje:          true,
        total:            true,
        puntajePreliminar: true,
        puntajeTRI:       true,
        estadoCalif:      true,
        tiempoUsado:      true,
        completadoEn:     true,
        examen: {
          select: { nombre: true, materia: true, estado: true },
        },
      },
    });

    // Puntaje efectivo helper
    const pctEfectivo = (r: any): number => {
      if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
        return Number(r.puntajeTRI);
      return r.puntajePreliminar ?? (r.total > 0 ? (r.puntaje / r.total) * 100 : 0);
    };

    // ── 5. Métricas por simulacro ─────────────────────────────────────────
    const metricasPorSimulacro = examenes.map((ex: any) => {
      const resultadosEx = todosResultados.filter((r: any) => r.examenId === ex.id);
      const n = resultadosEx.length;

      if (n === 0) {
        return {
          id:            ex.id,
          nombre:        ex.nombre,
          materia:       ex.materia,
          estado:        ex.estado,
          triCalculado:  ex.triCalculado,
          tieneSesiones: ex.tieneSesiones,
          totalClaves:   ex._count.claves,
          participantes: 0,
          promedioPorc:  null,
          puntajeEscalado: null,
          mejorPorc:     null,
          peorPorc:      null,
          oficiales:     0,
          createdAt:     ex.createdAt,
          fechaCierre:   ex.fechaCierre,
        };
      }

      const pcts      = resultadosEx.map(pctEfectivo);
      const promedio  = pcts.reduce((a: number, b: number) => a + b, 0) / n;
      const oficiales = resultadosEx.filter((r: any) => r.estadoCalif === "OFICIAL").length;

      return {
        id:              ex.id,
        nombre:          ex.nombre,
        materia:         ex.materia,
        estado:          ex.estado,
        triCalculado:    ex.triCalculado,
        tieneSesiones:   ex.tieneSesiones,
        totalClaves:     ex._count.claves,
        participantes:   n,
        promedioPorc:    Math.round(promedio),
        puntajeEscalado: Math.round((promedio / 100) * 500),
        mejorPorc:       Math.round(Math.max(...pcts)),
        peorPorc:        Math.round(Math.min(...pcts)),
        oficiales,
        createdAt:       ex.createdAt,
        fechaCierre:     ex.fechaCierre,
      };
    });

    // ── 6. Distribución de puntajes (para histograma) ─────────────────────
    const rangos = [
      { label: "0–20",   min: 0,  max: 20  },
      { label: "21–40",  min: 21, max: 40  },
      { label: "41–60",  min: 41, max: 60  },
      { label: "61–80",  min: 61, max: 80  },
      { label: "81–100", min: 81, max: 100 },
    ];

    const distribucion = rangos.map(({ label, min, max }) => ({
      label,
      cantidad: todosResultados.filter((r: any) => {
        const p = pctEfectivo(r);
        return p >= min && p <= max;
      }).length,
    }));

    // ── 7. Actividad por día (últimos 30 días) ────────────────────────────
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);

    const actividadReciente = todosResultados
      .filter((r: any) => new Date(r.completadoEn) >= hace30)
      .reduce((acc: Record<string, number>, r: any) => {
        const dia = new Date(r.completadoEn).toISOString().slice(0, 10);
        acc[dia] = (acc[dia] ?? 0) + 1;
        return acc;
      }, {});

    const actividad = Object.entries(actividadReciente)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // ── 8. Top 5 estudiantes globales ─────────────────────────────────────
    const porEstudiante: Record<string, { nombre: string; pcts: number[]; colegio: string | null }> = {};
    for (const r of todosResultados) {
      if (!porEstudiante[r.estudianteId]) {
        const u = await db.usuario.findUnique({
          where: { id: r.estudianteId },
          select: { nombre: true, colegio: true },
        });
        porEstudiante[r.estudianteId] = {
          nombre:  u?.nombre ?? "Desconocido",
          colegio: u?.colegio ?? null,
          pcts:    [],
        };
      }
      porEstudiante[r.estudianteId].pcts.push(pctEfectivo(r));
    }

    const topEstudiantes = Object.entries(porEstudiante)
      .map(([id, { nombre, colegio, pcts }]) => ({
        id,
        nombre,
        colegio,
        simulacros:   pcts.length,
        promedioPorc: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      }))
      .sort((a, b) => b.promedioPorc - a.promedioPorc)
      .slice(0, 5);

    return NextResponse.json({
      sistema: {
        totalEstudiantes,
        totalSimulacros,
        totalResultados,
        resultadosOficiales,
        estadoSimulacros: {
          borrador:  estadoMap["BORRADOR"]  ?? 0,
          publicado: estadoMap["PUBLICADO"] ?? 0,
          cerrado:   estadoMap["CERRADO"]   ?? 0,
          archivado: estadoMap["ARCHIVADO"] ?? 0,
        },
      },
      simulacros:    metricasPorSimulacro,
      distribucion,
      actividad,
      topEstudiantes,
    });
  } catch (error) {
    console.error("[GET /api/admin/reportes]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}