// app/api/dashboard/ranking/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "global";

    const usuarioActual = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { grupoId: true },
    });

    const whereUsuario: any = {
      rol: "ESTUDIANTE",
      suscripcion: { activa: true },
    };

    if (scope === "grupo") {
      if (!usuarioActual?.grupoId) {
        return NextResponse.json({ ranking: [], miPosicion: null, scope });
      }
      whereUsuario.grupoId = usuarioActual.grupoId;
    }

    const estudiantes = await db.usuario.findMany({
      where: whereUsuario,
      select: {
        id: true,
        nombre: true,
        imagen: true,
        ciudad: true,
        colegio: true,
        grupo: { select: { nombre: true } },
        resultados: {
          select: {
            puntaje: true,
            total: true,
            completadoEn: true,
            examen: { select: { materia: true } },
          },
        },
      },
    });

    // Calcular métricas
    const rankingRaw = estudiantes
      .map((e) => {
        const completados = e.resultados.length;
        if (completados === 0) return null;

        const porcentajes = e.resultados.map((r) => (r.puntaje / r.total) * 100);
        const promedioPorc = porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length;
        const puntajeEscalado = Math.round((promedioPorc / 100) * 500);
        const mejorPorc = Math.max(...porcentajes);

        return {
          id: e.id,
          nombre: e.nombre,
          imagen: e.imagen,
          ciudad: e.ciudad,
          colegio: e.colegio,
          grupo: e.grupo?.nombre ?? null,
          simulacrosCompletados: completados,
          promedioPorc: Math.round(promedioPorc),
          puntajeEscalado,
          mejorPuntaje: Math.round((mejorPorc / 100) * 500),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.puntajeEscalado - a.puntajeEscalado);

    // Asignar posición con empates
    let pos = 1;
    const ranking = rankingRaw.map((e: any, i: number) => {
      if (i > 0 && e.puntajeEscalado < (rankingRaw[i - 1] as any).puntajeEscalado) pos = i + 1;
      return { ...e, posicion: pos };
    });

    const miPosicion = ranking.find((r: any) => r.id === session.user.id)?.posicion ?? null;

    return NextResponse.json({ ranking, miPosicion, scope });
  } catch (error) {
    console.error("[GET /api/dashboard/ranking]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}