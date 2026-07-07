import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDeveloper } from "@/lib/developer-guard";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    });

    if (!examen) {
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    }

    await (db as any).examenTemplate.update({
      where: { id: params.id },
      data: { estado: "PUBLICADO" },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[PATCH /api/developer/simulacros/[id]/unarchive]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
