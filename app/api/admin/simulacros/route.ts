// app/api/admin/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normaliza la fecha que viene del <input type="datetime-local">.
 * El browser envía "2026-05-16T14:30" (sin segundos ni zona horaria).
 * Zod .datetime() requiere ISO-8601 completo con zona horaria.
 * Esta función convierte ambos formatos a un Date válido, devolviendo
 * null si el string está vacío o es nulo.
 */
function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;
  // Agregar ":00Z" si el string termina en HH:MM sin segundos
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00.000Z`
    : trimmed;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

// ── Schemas ────────────────────────────────────────────────────────────────
const claveSchema = z.object({
  numero:     z.number().int().positive(),
  respuesta:  z.enum(["A", "B", "C", "D"]).nullable(),
  sesion:     z.number().int().positive().default(1),   // sin límite de 2 — puede haber N sesiones
  dificultad: z.enum(["facil", "media", "dificil"]).optional().default("media"),
});

const sesionSchema = z.object({
  numero:    z.number().int().positive(),               // sin límite de 2
  nombre:    z.string().min(1).max(200),
  tiempoMin: z.number().int().positive().default(60),
});

const crearSimulacroSchema = z.object({
  nombre:          z.string().min(1, "El nombre es obligatorio").max(120),
  materia:         z.string().min(1, "La materia es obligatoria"),
  totalPreguntas:  z.number().int().positive().default(50),
  tiempoMin:       z.number().int().positive().default(120),
  tieneSesiones:   z.boolean().default(false),
  sesiones:        z.array(sesionSchema).optional(),
  claves:          z.array(claveSchema),
  estado:          z.enum(["BORRADOR", "PUBLICADO"]).default("BORRADOR"),
  // Acepta string vacío, null, undefined o ISO-8601 con / sin segundos
  fechaDisponible: z.string().optional().nullable(),
  fechaCierre:     z.string().optional().nullable(),
});

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

// ── POST ───────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = crearSimulacroSchema.safeParse(body);

    if (!parsed.success) {
      // Devolver TODOS los errores para facilitar el debug
      const mensajes = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      console.error("[POST /api/admin/simulacros] Zod errors:", mensajes);
      return NextResponse.json(
        { error: mensajes[0] ?? "Datos inválidos", detalles: mensajes },
        { status: 400 },
      );
    }

    const {
      nombre, materia, totalPreguntas, tiempoMin,
      tieneSesiones, sesiones, claves, estado,
      fechaDisponible: fdRaw, fechaCierre: fcRaw,
    } = parsed.data;

    const fechaDisponible = parseFecha(fdRaw);
    const fechaCierre     = parseFecha(fcRaw);

    // Solo contar claves con respuesta definida
    const clavesDefinidas = claves.filter((c) => c.respuesta !== null);
    if (clavesDefinidas.length === 0) {
      return NextResponse.json(
        { error: "Define al menos una respuesta correcta" },
        { status: 400 },
      );
    }

    // ── CASO: Simulacro con sesiones (grupal) ─────────────────────────────
    if (tieneSesiones && sesiones && sesiones.length > 0) {
      const examen = await (db as any).examenTemplate.create({
        data: {
          nombre,
          materia,
          totalPreguntas,
          tiempoMin,
          estado,
          tieneSesiones: true,
          triCalculado:  false,
          creadoPorId:   session.user.id,
          fechaDisponible,
          fechaCierre,
          sesiones: {
            create: sesiones.map((s) => ({
              numero:    s.numero,
              nombre:    s.nombre,
              tiempoMin: s.tiempoMin,
            })),
          },
        },
        include: { sesiones: true },
      });

      // Asignar claves a la sesión correspondiente según el número
      for (const sesionDb of examen.sesiones) {
        const clavesParaSesion = clavesDefinidas
          .filter((c) => c.sesion === sesionDb.numero)
          .map((c) => ({
            examenId:       examen.id,
            sesionId:       sesionDb.id,
            numeroPregunta: c.numero,
            respuesta:      c.respuesta as string,
            // dificultad se guarda en metadata si el schema lo soporta;
            // si no existe la columna en Prisma, simplemente se omite sin error
          }));

        if (clavesParaSesion.length > 0) {
          await (db as any).claveExamen.createMany({ data: clavesParaSesion });
        }
      }

      await _auditLog(session.user.id, examen.id, nombre, estado);
      return NextResponse.json({ ok: true, id: examen.id, nombre }, { status: 201 });
    }

    // ── CASO: Simulacro sin sesiones (individual) ─────────────────────────
    // Buscar o crear la sesión única para asociar las claves con sesionId
    const examen = await (db as any).examenTemplate.create({
      data: {
        nombre,
        materia,
        totalPreguntas,
        tiempoMin,
        estado,
        tieneSesiones: false,
        triCalculado:  false,
        creadoPorId:   session.user.id,
        fechaDisponible,
        fechaCierre,
        sesiones: {
          // Crear sesión única interna para mantener integridad referencial
          create: [{
            numero:    1,
            nombre:    "Sesión única",
            tiempoMin: tiempoMin,
          }],
        },
      },
      include: { sesiones: true },
    });

    const sesionUnica = examen.sesiones[0];

    if (sesionUnica) {
      await (db as any).claveExamen.createMany({
        data: clavesDefinidas.map((c) => ({
          examenId:       examen.id,
          sesionId:       sesionUnica.id,
          numeroPregunta: c.numero,
          respuesta:      c.respuesta as string,
        })),
      });
    } else {
      // Fallback: guardar sin sesionId (compatible con schema antiguo)
      await (db as any).claveExamen.createMany({
        data: clavesDefinidas.map((c) => ({
          examenId:       examen.id,
          numeroPregunta: c.numero,
          respuesta:      c.respuesta as string,
        })),
      });
    }

    await _auditLog(session.user.id, examen.id, nombre, estado);
    return NextResponse.json({ ok: true, id: examen.id, nombre }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/admin/simulacros]", e);
    // Devolver detalles del error Prisma si existen
    const msg = e?.message ?? "Error interno";
    return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
  }
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    const examenes = await (db as any).examenTemplate.findMany({
      where: estado ? { estado } : undefined,
      include: {
        _count:   { select: { claves: true } },
        sesiones: {
          select: { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ examenes });
  } catch (e) {
    console.error("[GET /api/admin/simulacros]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── Audit log helper ───────────────────────────────────────────────────────
async function _auditLog(
  userId: string,
  examenId: string,
  nombre: string,
  estado: string,
) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId: userId,
        accion:    "CREAR_SIMULACRO",
        recurso:   "examen_template",
        recursoId: examenId,
        resultado: "EXITOSO",
        mensaje:   `Simulacro "${nombre}" creado con estado ${estado}`,
      },
    });
  } catch { /* no bloquear el flujo principal */ }
}