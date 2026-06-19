// app/api/developer/perfil/audit-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 20), 1), 50);

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where: { usuarioId: developer.id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.auditLog.count({ where: { usuarioId: developer.id } }),
  ]);

  return NextResponse.json({ items, total, skip, take });
}