// app/api/admin/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Esquema de validación ──────────────────────────────────────────────────
const claveSchema = z.object({
  numero: z.number().int().positive(),
  respuesta: z.enum(["A", "B", "C", "D"]).nullable(),
});

const crearSimulacroSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  materia: z.string().min(1, "La materia es obligatoria"),
  totalPreguntas: z.number().int().positive().default(50),
  tiempoMin: z.number().int().positive().default(120),
  claves: z.array(claveSchema),
  estado: z.enum(["BORRADOR", "PUBLICADO"]).default("BORRADOR"),
});

// ── POST /api/admin/simulacros ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1. Verificar sesión y rol ADMIN
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // 2. Validar body
    const body = await req.json();
    const parsed = crearSimulacroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { nombre, materia, totalPreguntas, tiempoMin, claves, estado } = parsed.data;

    // 3. Filtrar solo las claves con respuesta definida
    const clavesDefinidas = claves.filter((c) => c.respuesta !== null);
    if (clavesDefinidas.length === 0) {
      return NextResponse.json(
        { error: "Define al menos una respuesta correcta" },
        { status: 400 }
      );
    }

    // 4. Crear en BD
    // NOTA: Requiere haber ejecutado la migración de schema_addition.prisma
    // npx prisma migrate dev --name add_examenes_template
    const examen = await (db as any).examenTemplate.create({
      data: {
        nombre,
        materia,
        totalPreguntas,
        tiempoMin,
        estado,
        creadoPorId: session.user.id,
        claves: {
          create: clavesDefinidas.map((c) => ({
            numeroPregunta: c.numero,
            respuesta: c.respuesta as string,
          })),
        },
      },
      include: { claves: true },
    });

    // 5. Registrar en audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "CREAR_SIMULACRO",
          recurso: "examen_template",
          recursoId: examen.id,
          resultado: "EXITOSO",
          mensaje: `Simulacro "${nombre}" creado con estado ${estado}`,
        },
      });
    } catch {
      // No bloquear si el audit falla
    }

    return NextResponse.json(
      { ok: true, id: examen.id, nombre: examen.nombre },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/simulacros]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── GET /api/admin/simulacros ──────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    const examenes = await (db as any).examenTemplate.findMany({
      where: estado ? { estado } : undefined,
      include: { _count: { select: { claves: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ examenes });
  } catch (error) {
    console.error("[GET /api/admin/simulacros]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}