// app/api/dashboard/simulacros/[id]/sesion/[num]/enviar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { calcularPuntajePreliminar } from "@/lib/tri-engine";

const bodySchema = z.object({
  respuestas:  z.record(z.string(), z.enum(["A", "B", "C", "D"])),
  tiempoUsado: z.number().int().nonnegative(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string; num: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const numSesion = parseInt(params.num, 10);
    if (isNaN(numSesion) || numSesion < 1 || numSesion > 2) {
      return NextResponse.json({ error: "Número de sesión inválido" }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const { respuestas, tiempoUsado } = parsed.data;

    // Obtener la sesión del examen
    const sesion = await (db as any).sesionExamen.findFirst({
      where:   { examenId: params.id, numero: numSesion },
      include: { claves: { orderBy: { numeroPregunta: "asc" } } },
    });

    if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    // Verificar que ya no la respondió
    const existente = await (db as any).resultadoSesion.findUnique({
      where: {
        estudianteId_sesionId: {
          estudianteId: session.user.id,
          sesionId:     sesion.id,
        },
      },
    });
    if (existente) return NextResponse.json({ error: "Ya respondiste esta sesión" }, { status: 409 });

    // Contar correctas
    let correctas = 0;
    const detalles: Record<string, { dada: string | null; correcta: string; correcto: boolean }> = {};

    for (const clave of sesion.claves) {
      const num      = String(clave.numeroPregunta);
      const correcta = clave.respuesta;
      const dada     = respuestas[num] ?? null;
      const correcto = dada === correcta;
      if (correcto) correctas++;
      detalles[num] = { dada, correcta, correcto };
    }

    const total              = sesion.claves.length;
    const puntajePreliminar  = calcularPuntajePreliminar(correctas, total);

    // Guardar resultado de sesión
    const resultadoSesion = await (db as any).resultadoSesion.create({
      data: {
        estudianteId:     session.user.id,
        examenId:         params.id,
        sesionId:         sesion.id,
        respuestas,
        correctas,
        total,
        puntajePreliminar,
        tiempoUsado,
      },
    });

    // Verificar si completó TODAS las sesiones del simulacro
    const todasSesiones = await (db as any).sesionExamen.findMany({
      where: { examenId: params.id },
      select: { id: true },
    });

    const resultadosExistentes = await (db as any).resultadoSesion.findMany({
      where: {
        estudianteId: session.user.id,
        examenId:     params.id,
      },
    });

    const completoTodo = resultadosExistentes.length === todasSesiones.length;

    if (completoTodo) {
      // Calcular puntaje global preliminar (promedio ponderado de sesiones)
      const sumaPuntajes  = resultadosExistentes.reduce((a: number, r: any) => a + r.puntajePreliminar, 0);
      const promedioGlobal = Math.round(sumaPuntajes / resultadosExistentes.length);

      // Crear o actualizar ResultadoSimulacro global
      await (db as any).resultadoSimulacro.upsert({
        where: {
          estudianteId_examenId: {
            estudianteId: session.user.id,
            examenId:     params.id,
          },
        },
        create: {
          estudianteId:       session.user.id,
          examenId:           params.id,
          respuestas:         {},               // vacío, las reales están en ResultadoSesion
          puntaje:            promedioGlobal,
          puntajePreliminar:  promedioGlobal,
          total:              100,              // base 100 pts
          tiempoUsado,
          estadoCalif:        "PRELIMINAR",
        },
        update: {
          puntaje:           promedioGlobal,
          puntajePreliminar: promedioGlobal,
          estadoCalif:       "PRELIMINAR",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      puntajePreliminar,
      correctas,
      total,
      detalles,
      completoSimulacro: completoTodo,
    }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Ya respondiste esta sesión" }, { status: 409 });
    console.error("[POST sesion/enviar]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}