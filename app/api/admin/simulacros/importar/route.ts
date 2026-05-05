// app/api/admin/simulacros/importar/route.ts
//
// Requiere: npm install xlsx
// Esta ruta acepta un archivo .xlsx/.xls con columnas:
//   simulacro | materia | pregunta | respuesta_correcta
// y crea los ExamenTemplate + ClaveExamen correspondientes.
//
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── Tipos internos ────────────────────────────────────────────────────────
interface FilaExcel {
  simulacro: string | number;
  materia: string;
  pregunta: string | number;
  respuesta_correcta: string;
}

interface GrupoSimulacro {
  materia: string;
  claves: { numeroPregunta: number; respuesta: string }[];
  errores: string[];
}

const RESPUESTAS_VALIDAS = new Set(["A", "B", "C", "D"]);

// ── POST /api/admin/simulacros/importar ───────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1. Auth
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

    // 2. Leer archivo del FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: "Formato no válido. Solo se aceptan .xlsx y .xls" },
        { status: 400 }
      );
    }

    // 3. Parsear Excel con SheetJS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx") as typeof import("xlsx");
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "El archivo no contiene hojas" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: FilaExcel[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    // 4. Validar columnas requeridas
    const primeraFila = rows[0];
    const columnasRequeridas = ["simulacro", "materia", "pregunta", "respuesta_correcta"];
    for (const col of columnasRequeridas) {
      if (!(col in primeraFila)) {
        return NextResponse.json(
          { error: `Falta la columna obligatoria: "${col}"` },
          { status: 400 }
        );
      }
    }

    // 5. Agrupar filas por número de simulacro
    const grupos = new Map<string, GrupoSimulacro>();
    const mensajesError: string[] = [];
    let filasRechazadas = 0;

    rows.forEach((row, idx) => {
      const fila = idx + 2; // índice 1-based para el usuario (fila 1 = encabezado)
      const numSim = String(row.simulacro ?? "").trim();
      const materia = String(row.materia ?? "").trim();
      const numPregRaw = Number(row.pregunta);
      const respuesta = String(row.respuesta_correcta ?? "").trim().toUpperCase();

      // Validaciones
      if (!numSim) {
        mensajesError.push(`Fila ${fila}: columna "simulacro" vacía — rechazada.`);
        filasRechazadas++;
        return;
      }
      if (!materia) {
        mensajesError.push(`Fila ${fila}: columna "materia" vacía — rechazada.`);
        filasRechazadas++;
        return;
      }
      if (!Number.isInteger(numPregRaw) || numPregRaw < 1) {
        mensajesError.push(`Fila ${fila}: número de pregunta inválido ("${row.pregunta}") — rechazada.`);
        filasRechazadas++;
        return;
      }
      if (!RESPUESTAS_VALIDAS.has(respuesta)) {
        mensajesError.push(
          `Fila ${fila}: respuesta "${row.respuesta_correcta}" no válida (debe ser A, B, C o D) — rechazada.`
        );
        filasRechazadas++;
        return;
      }

      // Agregar al grupo
      if (!grupos.has(numSim)) {
        grupos.set(numSim, { materia, claves: [], errores: [] });
      }
      const grupo = grupos.get(numSim)!;

      // Detectar duplicados de pregunta dentro del mismo simulacro
      if (grupo.claves.some((c) => c.numeroPregunta === numPregRaw)) {
        mensajesError.push(
          `Fila ${fila}: pregunta ${numPregRaw} duplicada en simulacro ${numSim} — se omite.`
        );
        filasRechazadas++;
        return;
      }

      grupo.claves.push({ numeroPregunta: numPregRaw, respuesta });
    });

    if (grupos.size === 0) {
      return NextResponse.json(
        { error: "No se encontraron filas válidas para importar.", mensajes: mensajesError },
        { status: 400 }
      );
    }

    // 6. Crear ExamenTemplate por cada grupo
    let importados = 0;

    for (const [numSim, grupo] of grupos.entries()) {
      if (grupo.claves.length === 0) continue;

      await (db as any).examenTemplate.create({
        data: {
          nombre: `Simulacro ${numSim}`,
          materia: grupo.materia,
          totalPreguntas: grupo.claves.length,
          tiempoMin: 120,
          estado: "PUBLICADO",
          creadoPorId: session.user.id,
          claves: {
            create: grupo.claves,
          },
        },
      });
      importados++;
    }

    // 7. Audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "IMPORTAR_SIMULACROS",
          recurso: "examen_template",
          resultado: "EXITOSO",
          mensaje: `${importados} simulacro(s) importados desde Excel. ${filasRechazadas} filas rechazadas.`,
        },
      });
    } catch {
      // No bloquear
    }

    return NextResponse.json({
      ok: true,
      importados,
      errores: filasRechazadas,
      mensajes: mensajesError.slice(0, 20), // máximo 20 mensajes al cliente
    });
  } catch (error) {
    console.error("[POST /api/admin/simulacros/importar]", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el archivo." },
      { status: 500 }
    );
  }
}