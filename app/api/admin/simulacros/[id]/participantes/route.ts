// app/api/admin/simulacros/[id]/participantes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });
    if (!usuario || usuario.rol !== "ADMIN")
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    // Verificar que el examen existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      select: { id: true, nombre: true },
    });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    // Traer resultados globales con datos del estudiante
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where: { examenId: params.id },
      include: {
        estudiante: {
          select: {
            id:          true,
            nombre:      true,
            email:       true,
            documento:   true,
            colegio:     true,
            grado:       true,
            departamento: true,
            municipio:   true,
          },
        },
      },
      orderBy: { completadoEn: "desc" },
    });

    const participantes = resultados.map((r: any) => ({
      estudianteId: r.estudianteId,
      nombre:       r.estudiante.nombre      ?? "Sin nombre",
      email:        r.estudiante.email       ?? "",
      documento:    r.estudiante.documento   ?? null,
      colegio:      r.estudiante.colegio     ?? null,
      grado:        r.estudiante.grado       ?? null,
      departamento: r.estudiante.departamento ?? null,
      municipio:    r.estudiante.municipio   ?? null,
      puntaje:      r.puntaje                ?? 0,
      total:        r.total                  ?? 0,
      puntajeTRI:   r.puntajeTRI             ?? null,
      puntajeTRIEscalado: r.puntajeTRI != null ? Math.round((Number(r.puntajeTRI) / 100) * 500) : null,
      estadoCalif:  r.estadoCalif            ?? "PRELIMINAR",
      tiempoUsado:  r.tiempoUsado            ?? 0,
      completadoEn: r.completadoEn,
    }));

    return NextResponse.json({ participantes });
  } catch (e) {
    console.error("[GET participantes]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}