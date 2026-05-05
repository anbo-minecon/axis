// app/api/admin/anuncios/upload/route.ts
//
// ⚠️  IMPORTANTE PARA DESPLIEGUE:
// Esta ruta guarda imágenes en public/images/anuncios/.
// Funciona perfectamente en VPS / servidor propio.
// En Vercel el sistema de archivos es efímero — las imágenes
// se perderán en cada redeploy. Para Vercel usa URL externa (Imgur, Cloudinary).
//
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Crear carpeta si no existe
    const uploadDir = join(process.cwd(), "public", "images", "anuncios");
    await mkdir(uploadDir, { recursive: true });

    // Nombre único: timestamp + nombre original sanitizado
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = `anuncio_${Date.now()}.${ext}`;
    const filePath = join(uploadDir, safeName);

    // Guardar archivo
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL pública
    const url = `/images/anuncios/${safeName}`;

    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/anuncios/upload]", e);
    return NextResponse.json({ error: "Error al guardar la imagen" }, { status: 500 });
  }
}