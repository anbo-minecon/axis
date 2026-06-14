// app/api/dashboard/ranking/route.ts
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

    const { searchParams } = new URL(req.url);
    const scope    = searchParams.get("scope")    ?? "global";  // global | grupo
    const materiaQ = searchParams.get("materia")  ?? "todas";
    const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    const usuarioActual = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { grupoId: true },
    });

    // Filtro de usuarios
    const whereUsuario: any = { rol: "ESTUDIANTE" };
    if (scope === "grupo") {
      if (!usuarioActual?.grupoId)
        return NextResponse.json({ ranking: [], miPosicion: null, scope, total: 0 });
      whereUsuario.grupoId = usuarioActual.grupoId;
    }

    // Filtro de exámenes por materia
    const whereExamen: any = {
      estado: { in: ["CERRADO", "PUBLICADO"] },
    };
    if (materiaQ !== "todas") whereExamen.materia = materiaQ;

    const estudiantes = await db.usuario.findMany({
      where: whereUsuario,
      select: {
        id:      true,
        nombre:  true,
        imagen:  true,
        ciudad:  true,
        colegio: true,
        grupo:   { select: { nombre: true } },
        resultados: {
          where: { examen: whereExamen },
          select: {
            puntaje:          true,
            total:            true,
            puntajePreliminar: true,
            puntajeTRI:       true,
            estadoCalif:      true,
            completadoEn:     true,
            examen:           { select: { materia: true, nombre: true } },
          },
        },
      },
    });

    // ── Calcular métricas por estudiante ──────────────────────────────────
    const rankingRaw = estudiantes
      .map((e) => {
        const completados = e.resultados.length;
        if (completados === 0) return null;

        // Puntaje efectivo: TRI si oficial, preliminar si no
        const puntajesEfectivos = e.resultados.map((r) => {
          if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
            return Number(r.puntajeTRI);
          return r.puntajePreliminar ?? (r.total > 0 ? (r.puntaje / r.total) * 100 : 0);
        });

        const promedioPorc   = puntajesEfectivos.reduce((a, b) => a + b, 0) / puntajesEfectivos.length;
        const puntajeEscalado = Math.round((promedioPorc / 100) * 500);
        const mejorPorc       = Math.max(...puntajesEfectivos);
        const oficiales       = e.resultados.filter((r) => r.estadoCalif === "OFICIAL").length;

        // Racha: simulacros consecutivos con pct >= 60
        let rachaActual = 0;
        for (let i = puntajesEfectivos.length - 1; i >= 0; i--) {
          if (puntajesEfectivos[i] >= 60) rachaActual++;
          else break;
        }

        return {
          id:                    e.id,
          nombre:                e.nombre,
          imagen:                e.imagen,
          ciudad:                e.ciudad,
          colegio:               e.colegio,
          grupo:                 e.grupo?.nombre ?? null,
          simulacrosCompletados: completados,
          oficiales,
          promedioPorc:          Math.round(promedioPorc),
          puntajeEscalado,
          mejorPuntaje:          Math.round((mejorPorc / 100) * 500),
          rachaActual,
          esMiPerfil:            e.id === session.user.id,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Orden: primero por puntaje, luego por cantidad de simulacros
        if (b.puntajeEscalado !== a.puntajeEscalado)
          return b.puntajeEscalado - a.puntajeEscalado;
        return b.simulacrosCompletados - a.simulacrosCompletados;
      });

    // Asignar posición con empates correctos
    let pos = 1;
    const rankingConPos = rankingRaw.map((e: any, i: number) => {
      if (i > 0 && e.puntajeEscalado < (rankingRaw[i - 1] as any).puntajeEscalado) pos = i + 1;
      return { ...e, posicion: pos };
    });

    const total        = rankingConPos.length;
    const ranking      = rankingConPos.slice(0, limit);
    const miPosicion   = rankingConPos.find((r: any) => r.id === session.user.id)?.posicion ?? null;
    const miEntrada    = rankingConPos.find((r: any) => r.id === session.user.id) ?? null;

    // Materias disponibles para el filtro
    const materiasDisponibles = await (db as any).examenTemplate.findMany({
      where:    { estado: { in: ["CERRADO", "PUBLICADO"] } },
      select:   { materia: true },
      distinct: ["materia"],
      orderBy:  { materia: "asc" },
    });

    return NextResponse.json({
      ranking,
      miPosicion,
      miEntrada,
      scope,
      total,
      materias: materiasDisponibles.map((m: any) => m.materia),
    });
  } catch (error) {
    console.error("[GET /api/dashboard/ranking]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}