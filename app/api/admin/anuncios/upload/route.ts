// app/api/admin/anuncios/upload/route.ts
//
// Sube la imagen a Vercel Blob (almacenamiento persistente, compatible
// con el filesystem efímero de Vercel). Devuelve una URL pública estable.
//
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB   = 5;

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("imagen") as File | null;

    if (!file) return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no válido. Solo JPG, PNG o WebP." },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `La imagen no puede superar ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Nombre único: timestamp + extensión original
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = `anuncios/anuncio_${Date.now()}.${ext}`;

    // Subir a Vercel Blob (almacenamiento persistente)
    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
    });

    // blob.url ya es una URL pública completa y estable (CDN de Vercel)
    return NextResponse.json({ ok: true, url: blob.url }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/anuncios/upload]", e);
    return NextResponse.json({ error: "Error al guardar la imagen" }, { status: 500 });
  }
}