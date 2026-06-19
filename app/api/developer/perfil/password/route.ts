// app/api/developer/perfil/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";

const schema = z.object({
  passwordActual: z.string().min(1),
  passwordNuevo: z.string().min(8).max(72),
});

export async function PATCH(req: NextRequest) {
  const developer = await authenticateDeveloper();
  if (!developer || !developer.developerCred) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const esValida = await compare(
    parsed.data.passwordActual,
    developer.developerCred.passwordHash
  );
  if (!esValida) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
  }

  const nuevoHash = await hash(parsed.data.passwordNuevo, 10);
  await db.developerCredential.update({
    where: { id: developer.developerCred.id },
    data: { passwordHash: nuevoHash },
  });

  return NextResponse.json({ success: true });
}