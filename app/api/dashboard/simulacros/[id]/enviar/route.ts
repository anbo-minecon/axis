// app/api/dashboard/simulacros/[id]/enviar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  respuestas: z.record(z.string(), z.enum(["A", "B", "C", "D"])),
  tiempoUsado: z.number().int().nonnegative(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { respuestas, tiempoUsado } = parsed.data;

    // Verificar que el examen existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id, estado: "PUBLICADO" },
      include: { claves: { orderBy: { numeroPregunta: "asc" } } },
    });

    if (!examen) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    // Verificar si ya completó el examen
    const existente = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId: params.id,
        },
      },
    });

    if (existente) {
      return NextResponse.json({ error: "Ya completaste este simulacro" }, { status: 409 });
    }

    // Calcular puntaje
    const claveMap = new Map<number, string>(
      examen.claves.map((c: any) => [c.numeroPregunta, c.respuesta])
    );

    let puntaje = 0;
    const detalles: Record<string, { dada: string | null; correcta: string; correcto: boolean }> = {};

    for (const [numStr, correcta] of claveMap.entries()) {
      const dada = respuestas[String(numStr)] ?? null;
      const correcto = dada === correcta;
      if (correcto) puntaje++;
      detalles[String(numStr)] = { dada, correcta, correcto };
    }

    const total = claveMap.size;

    // Guardar resultado
    await (db as any).resultadoSimulacro.create({
      data: {
        estudianteId: session.user.id,
        examenId: params.id,
        respuestas,
        puntaje,
        total,
        tiempoUsado,
      },
    });

    return NextResponse.json({
      ok: true,
      puntaje,
      total,
      porcentaje: Math.round((puntaje / total) * 100),
      detalles, // { "1": { dada: "A", correcta: "B", correcto: false }, ... }
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya completaste este simulacro" }, { status: 409 });
    }
    console.error("[POST /api/dashboard/simulacros/[id]/enviar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}