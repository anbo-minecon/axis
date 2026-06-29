import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { z } from "zod";

export const dynamic = "force-dynamic";

function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00.000Z`
    : trimmed;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date;
}

const updateSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  tiempoMin: z.number().int().positive().optional(),
  totalPreguntas: z.number().int().positive().optional(),
  fechaDisponible: z.string().optional().nullable(),
  fechaCierre: z.string().optional().nullable(),
  claves: z
    .array(
      z.object({
        id: z.string().min(1),
        respuesta: z.enum(["A", "B", "C", "D", "E", "F", "G", "H"]),
      })
    )
    .optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      include: {
        claves: { orderBy: { numeroPregunta: "asc" } },
        sesiones: { orderBy: { numero: "asc" } },
      },
    });

    if (!examen) {
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      simulacro: {
        id: examen.id,
        nombre: examen.nombre,
        materia: examen.materia,
        totalPreguntas: examen.totalPreguntas,
        tiempoMin: examen.tiempoMin,
        estado: examen.estado,
        createdAt: examen.createdAt.toISOString(),
        updatedAt: examen.updatedAt.toISOString(),
        claves: examen.claves.map((clave: any) => ({
          id: clave.id,
          numeroPregunta: clave.numeroPregunta,
          respuesta: clave.respuesta,
          area: clave.area ?? null,
          dificultad: clave.dificultad ?? null,
          sesionId: clave.sesionId ?? null,
        })),
        sesiones: examen.sesiones,
      },
    });
  } catch (error) {
    console.error("[GET /api/developer/simulacros/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const detalles = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: detalles[0], detalles }, { status: 400 });
    }

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen) {
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    }

    const { nombre, tiempoMin, totalPreguntas, fechaDisponible, fechaCierre, claves } = parsed.data;

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (tiempoMin !== undefined) updateData.tiempoMin = tiempoMin;
    if (totalPreguntas !== undefined) updateData.totalPreguntas = totalPreguntas;
    if (fechaDisponible !== undefined) updateData.fechaDisponible = parseFecha(fechaDisponible);
    if (fechaCierre !== undefined) updateData.fechaCierre = parseFecha(fechaCierre);

    if (Object.keys(updateData).length > 0) {
      await (db as any).examenTemplate.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    if (claves && claves.length > 0) {
      await Promise.all(
        claves.map((clave) =>
          (db as any).claveExamen.update({
            where: { id: clave.id },
            data: { respuesta: clave.respuesta },
          })
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[PUT /api/developer/simulacros/[id]]", error);
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await (db as any).examenTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[DELETE /api/developer/simulacros/[id]]", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
