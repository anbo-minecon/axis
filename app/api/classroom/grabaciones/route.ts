// app/api/classroom/grabaciones/route.ts
// GET  — lista grabaciones (por clase o todas)
// POST — agrega una grabación

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const crearSchema = z.object({
  claseId:     z.string(),
  titulo:      z.string().min(2).max(200),
  descripcion: z.string().max(500).optional(),
  linkUrl:     z.string().url("El link debe ser una URL válida"),
  materia:     z.string().max(100).optional(),
  fecha:       z.string().datetime(),
  duracionMin: z.number().int().min(1).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const claseId = searchParams.get("claseId");
    const materia = searchParams.get("materia");

    const where: any = { activa: true };
    if (claseId) where.claseId = claseId;
    if (materia)  where.materia = materia;

    // Estudiantes: solo grabaciones de sus clases
    if (session.user.rol === "ESTUDIANTE") {
      const usuario = await db.usuario.findUnique({
        where: { id: session.user.id },
        select: { grupoId: true },
      });
      const clases = await db.classroomClase.findMany({
        where: { grupoId: usuario?.grupoId ?? "__none__", estado: "ACTIVA" },
        select: { id: true },
      });
      where.claseId = { in: clases.map((c: any) => c.id) };
    }

    const grabaciones = await db.classroomGrabacion.findMany({
      where,
      include: {
        clase: { select: { nombre: true, materia: true } },
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json({ grabaciones });
  } catch (err: any) {
    console.error("[GET /api/classroom/grabaciones]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = session.user.rol;
    if (rol !== "ADMIN" && rol !== "DOCENTE") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = crearSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const grabacion = await db.classroomGrabacion.create({
      data: {
        claseId:     parsed.data.claseId,
        titulo:      parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        linkUrl:     parsed.data.linkUrl,
        materia:     parsed.data.materia ?? null,
        fecha:       new Date(parsed.data.fecha),
        duracionMin: parsed.data.duracionMin ?? null,
      },
    });

    return NextResponse.json({ grabacion }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/classroom/grabaciones]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}