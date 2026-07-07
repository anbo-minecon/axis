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
  { params }: { params: { id: string; num: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const numSesion = parseInt(params.num, 10);
    if (isNaN(numSesion) || numSesion < 1)
      return NextResponse.json({ error: "Número de sesión inválido" }, { status: 400 });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const { respuestas: rawRespuestas, tiempoUsado } = parsed.data;
    const now = new Date();

    const sesion = await (db as any).sesionExamen.findFirst({
      where: { examenId: params.id, numero: numSesion },
      include: {
        examen: {
          select: { estado: true, fechaDisponible: true, fechaCierre: true, tieneSesiones: true },
        },
      },
    });

    if (!sesion)
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    const examen = sesion.examen;
    if (!examen || !["PUBLICADO", "CERRADO"].includes(examen.estado))
      return NextResponse.json({ error: "El simulacro no está disponible" }, { status: 403 });

    if (examen.fechaCierre && now > new Date(examen.fechaCierre))
      return NextResponse.json({ error: "El simulacro ya cerró" }, { status: 403 });

    if (examen.fechaDisponible && !isSameCalendarDay(now, new Date(examen.fechaDisponible)))
      return NextResponse.json({ error: "Solo puedes guardar el borrador el día del simulacro" }, { status: 403 });

    if (numSesion === 1 && now.getHours() >= 12)
      return NextResponse.json({ error: "Sesión 1 solo permite guardar borrador antes de las 12:00" }, { status: 403 });

    const respuestas: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawRespuestas)) {
      const normalized = String(value).trim().toUpperCase();
      if (!ANSWER_VALUES_AH.includes(normalized as any)) {
        return NextResponse.json({ error: "Respuestas inválidas" }, { status: 400 });
      }
      respuestas[key] = normalized;
    }

    const existente = await (db as any).resultadoSesion.findUnique({
      where: {
        estudianteId_sesionId: {
          estudianteId: session.user.id,
          sesionId:     sesion.id,
        },
      },
      select: { id: true, esBorrador: true },
    });

    if (existente && !existente.esBorrador)
      return NextResponse.json({ error: "Ya completaste esta sesión" }, { status: 409 });

    if (existente) {
      await (db as any).resultadoSesion.update({
        where: { id: existente.id },
        data: {
          respuestas,
          tiempoUsado,
          esBorrador:   true,
          completadoEn: now,
        },
      });
    } else {
      await (db as any).resultadoSesion.create({
        data: {
          estudianteId: session.user.id,
          examenId:     params.id,
          sesionId:     sesion.id,
          respuestas,
          aciertos: 0,
          total: sesion.claves.length,
          tiempoUsado,
          esBorrador:   true,
          fechaInicio:  now,
          completadoEn: now,
        },
      });
    }

    return NextResponse.json({ ok: true, saved: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dashboard/simulacros/[id]/sesion/[num]/borrador]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
