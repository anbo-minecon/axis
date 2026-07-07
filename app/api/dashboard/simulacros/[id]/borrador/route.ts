import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  respuestas: z.record(z.string(), z.string()),
  tiempoUsado: z.number().int().nonnegative(),
});

const ANSWER_VALUES_AH = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const { respuestas: rawRespuestas, tiempoUsado } = parsed.data;
    const now = new Date();

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      select: {
        estado: true,
        fechaDisponible: true,
        fechaCierre: true,
      },
    });

    if (!examen || !["PUBLICADO", "CERRADO"].includes(examen.estado))
      return NextResponse.json({ error: "El simulacro no está disponible" }, { status: 403 });

    if (examen.fechaDisponible && !isSameCalendarDay(now, new Date(examen.fechaDisponible)))
      return NextResponse.json({ error: "Solo puedes guardar el borrador el día del simulacro" }, { status: 403 });

    if (examen.fechaCierre && now > new Date(examen.fechaCierre))
      return NextResponse.json({ error: "El simulacro ya cerró" }, { status: 403 });

    const respuestas: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawRespuestas)) {
      const normalized = String(value).trim().toUpperCase();
      if (!ANSWER_VALUES_AH.includes(normalized as any)) {
        return NextResponse.json({ error: "Respuestas inválidas" }, { status: 400 });
      }
      respuestas[key] = normalized;
    }

    const existente = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId:     params.id,
        },
      },
    });

    if (existente && !existente.esBorrador)
      return NextResponse.json({ error: "Ya completaste este simulacro" }, { status: 409 });

    if (existente) {
      await (db as any).resultadoSimulacro.update({
        where: { id: existente.id },
        data: {
          respuestas,
          tiempoUsado,
          esBorrador: true,
          completadoEn: now,
        },
      });
    } else {
      await (db as any).resultadoSimulacro.create({
        data: {
          estudianteId: session.user.id,
          examenId:     params.id,
          respuestas,
          tiempoUsado,
          esBorrador:   true,
          fechaInicio:  now,
          completadoEn: now,
        },
      });
    }

    return NextResponse.json({ ok: true, saved: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dashboard/simulacros/[id]/borrador]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
