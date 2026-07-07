import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const examenId = params.id;

    // Verificar que el examen existe y está cerrado
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: examenId },
      select: { id: true, nombre: true, fechaCierre: true, estado: true, materia: true },
    });
    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    if (examen.estado !== "CERRADO") return NextResponse.json({ error: "El boletín solo está disponible para simulacros cerrados" }, { status: 403 });

    // Recuperar resultado del estudiante
    const resultado = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId,
        },
      },
      include: {},
    });

    if (!resultado) return NextResponse.json({ error: "No tienes resultado para este simulacro" }, { status: 404 });

    // Construir HTML simple de boletín (puede transformarse a PDF en el futuro)
    const html = `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Boletín - ${examen.nombre}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
          .header { display:flex; justify-content:space-between; align-items:center; }
          .brand { font-weight:700; font-size:20px; }
          .meta { text-align:right; }
          .card { border:1px solid #ddd; padding:16px; margin-top:16px; border-radius:8px; }
          .row { display:flex; justify-content:space-between; margin-bottom:8px; }
          .label { color:#666; font-size:12px; }
          table { width:100%; border-collapse:collapse; margin-top:12px; }
          th, td { border:1px solid #e6e6e6; padding:8px; text-align:left; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Institución — Boletín de Resultado</div>
            <div style="font-size:13px;color:#444;margin-top:6px;">${examen.nombre} — ${examen.materia}</div>
          </div>
          <div class="meta">
            <div>Estudiante: ${session.user.name ?? session.user.email}</div>
            <div style="margin-top:8px;">Fecha: ${(new Date()).toLocaleString()}</div>
          </div>
        </div>

        <div class="card">
          <div class="row"><div class="label">Puntaje preliminar</div><div>${resultado.puntajePreliminar ?? "—"}</div></div>
          <div class="row"><div class="label">Puntaje TRI</div><div>${resultado.puntajeTRI ?? "—"}</div></div>
          <div class="row"><div class="label">Puntaje bruto (aciertos)</div><div>${resultado.puntaje ?? "—"} / ${resultado.total ?? "—"}</div></div>
          <div class="row"><div class="label">Estado calificación</div><div>${resultado.estadoCalif ?? "PRELIMINAR"}</div></div>
        </div>

        <div class="card">
          <h4>Detalles por área</h4>
          <table>
            <thead>
              <tr><th>Área</th><th>Puntos</th></tr>
            </thead>
            <tbody>
              ${renderAreas(resultado.puntajePorArea)}
            </tbody>
          </table>
        </div>

        <div style="margin-top:18px;font-size:12px;color:#666;">Este boletín fue generado automáticamente. Los puntajes oficiales son los publicados por la institución.</div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="boletin-${examen.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`,
      },
    });

  } catch (e: any) {
    console.error("[GET /api/dashboard/boletin/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function renderAreas(porArea: any) {
  if (!porArea) return `<tr><td colspan="2">—</td></tr>`;
  try {
    const obj = typeof porArea === 'string' ? JSON.parse(porArea) : porArea;
    return Object.entries(obj).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  } catch {
    return `<tr><td colspan="2">—</td></tr>`;
  }
}
