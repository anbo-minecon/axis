// app/api/admin/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

// Roles que un admin puede asignar — NUNCA DEVELOPER
const PUBLIC_ROLES = ["ESTUDIANTE", "DOCENTE", "ADMIN"] as const;

const crearUsuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(PUBLIC_ROLES),
});

const actualizarUsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rol: z.enum(PUBLIC_ROLES).optional(),
  activo: z.boolean().optional(),
});

/* ── Guard: solo ADMIN ── */
async function verificarAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { rol: true },
  });

  return usuario?.rol === "ADMIN" ? session : null;
}

/* ── GET: listar usuarios (sin DEVELOPER) ── */
export async function GET(req: NextRequest) {
  const session = await verificarAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q") ?? "";
  const rol = searchParams.get("rol") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = {
    // NUNCA mostrar DEVELOPER
    NOT: { rol: "DEVELOPER" },
  };

  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: "insensitive" } },
      { email: { contains: busqueda, mode: "insensitive" } },
    ];
  }

  if (rol && PUBLIC_ROLES.includes(rol as any)) {
    where.rol = rol;
  }

  if (estado === "activo") {
    where.activo = true;
  } else if (estado === "inactivo") {
    where.activo = false;
  }

  const [usuarios, total] = await Promise.all([
    db.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
        suscripcion: {
          select: { activa: true, plan: { select: { nombre: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.usuario.count({ where }),
  ]);

  // Stats (sin DEVELOPER)
  const [totalSinDev, estudiantes, docentes, conSuscripcion] = await Promise.all([
    db.usuario.count({ where: { NOT: { rol: "DEVELOPER" } } }),
    db.usuario.count({ where: { rol: "ESTUDIANTE" } }),
    db.usuario.count({ where: { rol: "DOCENTE" } }),
    db.suscripcion.count({ where: { activa: true } }),
  ]);

  return NextResponse.json({
    usuarios,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { total: totalSinDev, estudiantes, docentes, conSuscripcion },
  });
}

/* ── POST: crear usuario (rol nunca DEVELOPER) ── */
export async function POST(req: NextRequest) {
  const session = await verificarAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = crearUsuarioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
  }

  const { nombre, email, password, rol } = parsed.data;

  // Verificar email único
  const existe = await db.usuario.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const usuario = await db.usuario.create({
    data: { nombre, email, passwordHash, rol },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });

  return NextResponse.json({ usuario }, { status: 201 });
}

/* ── PATCH: actualizar usuario ── */
export async function PATCH(req: NextRequest) {
  const session = await verificarAdmin();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = actualizarUsuarioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { id, ...datos } = parsed.data;

  // Verificar que el usuario a editar no sea DEVELOPER
  const target = await db.usuario.findUnique({ where: { id }, select: { rol: true } });
  if (!target || target.rol === "DEVELOPER") {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const actualizado = await db.usuario.update({
    where: { id },
    data: datos,
    select: { id: true, nombre: true, email: true, rol: true },
  });

  return NextResponse.json({ usuario: actualizado });
}