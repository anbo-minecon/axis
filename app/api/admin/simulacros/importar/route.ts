// app/api/admin/simulacros/importar/route.ts
//
// Requiere: npm install xlsx
// Esta ruta acepta un archivo .xlsx/.xls con columnas:
//   simulacro | materia | pregunta | respuesta_correcta | sesion (opcional) | dificultad (opcional)
// 
// Si no especifica 'sesion', asume sesion 1 por defecto.
// Si especifica múltiples sesiones (1 y 2), crea un simulacro de 2 sesiones.
// Dificultad por defecto es 'media' si no se especifica.
//
// y crea los ExamenTemplate + SesionExamen + ClaveExamen correspondientes.
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
  sesion?: string | number;
  dificultad?: string;
}

interface ClavePorSesion {
  numeroPregunta: number;
  respuesta: string;
  sesionNumero: number;
  dificultad?: string;
}

interface GrupoSimulacro {
  materia: string;
  tieneSesiones: boolean;
  sesiones: Set<number>;
  claves: ClavePorSesion[];
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
      const sesionRaw = row.sesion ? Number(row.sesion) : 1; // Default sesion = 1
      const dificultad = String(row.dificultad ?? "facil").trim().toLowerCase();

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
      if (!Number.isInteger(sesionRaw) || sesionRaw < 1 || sesionRaw > 2) {
        mensajesError.push(
          `Fila ${fila}: sesión "${row.sesion}" no válida (debe ser 1 o 2) — rechazada.`
        );
        filasRechazadas++;
        return;
      }
      if (!["facil", "media", "dificil"].includes(dificultad)) {
        mensajesError.push(
          `Fila ${fila}: dificultad "${row.dificultad}" no válida (debe ser facil, media o dificil) — se asume "media".`
        );
        // No rechazamos, solo usamos default
      }

      // Agregar al grupo
      if (!grupos.has(numSim)) {
        grupos.set(numSim, { materia, tieneSesiones: false, sesiones: new Set(), claves: [], errores: [] });
      }
      const grupo = grupos.get(numSim)!;
      grupo.sesiones.add(sesionRaw);
      grupo.tieneSesiones = grupo.sesiones.size > 1;

      // Detectar duplicados de pregunta dentro de la misma sesión del simulacro
      if (grupo.claves.some((c) => c.numeroPregunta === numPregRaw && c.sesionNumero === sesionRaw)) {
        mensajesError.push(
          `Fila ${fila}: pregunta ${numPregRaw} duplicada en sesión ${sesionRaw} del simulacro ${numSim} — se omite.`
        );
        filasRechazadas++;
        return;
      }

      grupo.claves.push({ numeroPregunta: numPregRaw, respuesta, sesionNumero: sesionRaw, dificultad });
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

      const tieneSesiones = grupo.tieneSesiones;
      const sesionNums = Array.from(grupo.sesiones).sort((a, b) => a - b);

      if (tieneSesiones && sesionNums.length > 1) {
        // ── MULTI-SESIÓN ───────────────────────────────────────────────────
        // Crear ExamenTemplate con sesiones y agrupar claves por sesión
        const examen = await (db as any).examenTemplate.create({
          data: {
            nombre: `Simulacro ${numSim}`,
            materia: grupo.materia,
            totalPreguntas: grupo.claves.length,
            tiempoMin: 120,
            estado: "PUBLICADO",
            tieneSesiones: true,
            triCalculado: false,
            creadoPorId: session.user.id,
            sesiones: {
              create: sesionNums.map((num) => ({
                numero: num,
                nombre: `Sesión ${num}`,
                tiempoMin: 60,
              })),
            },
          },
          include: { sesiones: true },
        });

        // Agrupar claves por sesión y crear con sesionId
        for (const sesionDb of examen.sesiones) {
          const clavesDelSesion = grupo.claves
            .filter((c) => c.sesionNumero === sesionDb.numero)
            .map((c) => ({
              numeroPregunta: c.numeroPregunta,
              respuesta: c.respuesta,
              sesionId: sesionDb.id,
              dificultad: c.dificultad,
            }));

          if (clavesDelSesion.length > 0) {
            await (db as any).claveExamen.createMany({
              data: clavesDelSesion,
              skipDuplicates: true,
            });
          }
        }
      } else {
        // ── SESIÓN ÚNICA ────────────────────────────────────────────────────
        // Compatibilidad: simulacros sin sesiones o con solo sesión 1
        const examen = await (db as any).examenTemplate.create({
          data: {
            nombre: `Simulacro ${numSim}`,
            materia: grupo.materia,
            totalPreguntas: grupo.claves.length,
            tiempoMin: 120,
            estado: "PUBLICADO",
            tieneSesiones: false,
            triCalculado: false,
            creadoPorId: session.user.id,
            sesiones: {
              create: [{
                numero: 1,
                nombre: "Sesión única",
                tiempoMin: 120,
              }],
            },
          },
          include: { sesiones: true },
        });

        const sesion1 = examen.sesiones[0];
        const clavesConSesion = grupo.claves
          .map((c) => ({
            numeroPregunta: c.numeroPregunta,
            respuesta: c.respuesta,
            sesionId: sesion1.id,
            dificultad: c.dificultad,
          }));

        if (clavesConSesion.length > 0) {
          await (db as any).claveExamen.createMany({
            data: clavesConSesion,
            skipDuplicates: true,
          });
        }
      }
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