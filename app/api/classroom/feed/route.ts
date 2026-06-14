// app/api/classroom/feed/route.ts
// Extrae anuncios y tareas DIRECTAMENTE de Google Classroom API
// NO guarda nada en BD — datos frescos en cada llamada
// Incluye imágenes y links tal como vienen de Google

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const CLASSROOM_BASE = "https://classroom.googleapis.com/v1";

async function getValidToken(usuarioId: string): Promise<string | null> {
  const stored = await db.classroomToken.findUnique({ where: { usuarioId } });
  if (!stored) return null;

  // Refrescar si expiró
  const margen = 60 * 1000;
  if (stored.expiresAt.getTime() - margen > Date.now()) return stored.accessToken;

  if (!stored.refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ID!,
      client_secret: process.env.GOOGLE_SECRET!,
      grant_type:    "refresh_token",
      refresh_token: stored.refreshToken,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  await db.classroomToken.update({
    where: { usuarioId },
    data: {
      accessToken: data.access_token,
      expiresAt:   new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

async function gcall<T>(token: string, endpoint: string): Promise<T> {
  const res = await fetch(`${CLASSROOM_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 }, // cache 60s para no saturar API
  });
  if (!res.ok) throw new Error(`Classroom API ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let googleCourseId   = searchParams.get("courseId");
    const claseId        = searchParams.get("claseId");
    const tipo           = searchParams.get("tipo") ?? "todo"; // "anuncios" | "tareas" | "todo"
    const force          = searchParams.get("force") === "true";

    // Si viene claseId, buscar el googleCourseId
    if (claseId && !googleCourseId) {
      const clase = await db.classroomClase.findUnique({
        where: { id: claseId },
        select: { googleCourseId: true, nombre: true, materia: true, seccion: true, docenteId: true, docente: { select: { nombre: true } } },
      });
      if (!clase) {
        return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
      }
      googleCourseId = clase.googleCourseId;
    }

    if (!googleCourseId) {
      return NextResponse.json({ error: "claseId o courseId requerido" }, { status: 400 });
    }

    // Obtener token — primero del usuario actual, si no del docente de la clase
    let token = await getValidToken(session.user.id);

    // Si el estudiante no tiene token, buscar el del docente de esa clase
    if (!token && claseId) {
      const clase = await db.classroomClase.findUnique({
        where: { id: claseId },
        select: { docenteId: true },
      });
      if (clase?.docenteId) {
        token = await getValidToken(clase.docenteId);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Sin token de Classroom disponible", clase: null, anuncios: [], tareas: [] },
        { status: 200 } // no error — solo sin datos
      );
    }

    // Obtener info de la clase si viene claseId
    let claseInfo: any = null;
    if (claseId) {
      const clase = await db.classroomClase.findUnique({
        where: { id: claseId },
        select: { nombre: true, materia: true, seccion: true, docente: { select: { nombre: true } } },
      });
      claseInfo = clase;
    }

    const resultado: any = { clase: claseInfo, anuncios: [], tareas: [] };

    // ── Anuncios (con imágenes, links y texto tal como están en Google) ──────
    if (tipo === "anuncios" || tipo === "todo") {
      try {
        const data = await gcall<{ announcements?: any[] }>(
          token,
          `/courses/${googleCourseId}/announcements?pageSize=20&orderBy=updateTime desc`
        );

        resultado.anuncios = (data.announcements ?? [])
          .filter((a: any) => a.state === "PUBLISHED")
          .map((a: any) => ({
            id:           a.id,
            texto:        a.text ?? "",
            autor:        a.creatorUserId || "Profesor",
            fecha:        a.updateTime ?? a.creationTime,
            // Materiales adjuntos (imágenes, links, Drive, YouTube)
            materiales:   (a.materials ?? []).map((m: any) => {
              if (m.driveFile?.driveFile) {
                return {
                  tipo:      "DRIVE_FILE",
                  titulo:    m.driveFile.driveFile.title ?? "Archivo Drive",
                  url:       m.driveFile.driveFile.alternateLink,
                  thumbnail: m.driveFile.driveFile.thumbnailUrl,
                };
              }
              if (m.youtubeVideo) {
                return {
                  tipo:      "YOUTUBE",
                  titulo:    m.youtubeVideo.title ?? "Video YouTube",
                  url:       `https://youtube.com/watch?v=${m.youtubeVideo.id}`,
                  thumbnail: m.youtubeVideo.thumbnailUrl,
                };
              }
              if (m.link) {
                return {
                  tipo:      "LINK",
                  titulo:    m.link.title || m.link.url || "Enlace",
                  url:       m.link.url,
                  thumbnail: m.link.thumbnailUrl,
                };
              }
              if (m.form) {
                return {
                  tipo:      "FORM",
                  titulo:    m.form.title ?? "Formulario",
                  url:       m.form.formUrl,
                };
              }
              return null;
            }).filter(Boolean),
          }));
      } catch (err) {
        console.warn("[feed] Error al traer anuncios:", err);
      }
    }

    // ── Tareas/CourseWork (con imágenes, links, fechas) ───────────────────────
    if (tipo === "tareas" || tipo === "todo") {
      try {
        const data = await gcall<{ courseWork?: any[] }>(
          token,
          `/courses/${googleCourseId}/courseWork?pageSize=30&orderBy=updateTime desc`
        );

        resultado.tareas = (data.courseWork ?? [])
          .filter((t: any) => t.state === "PUBLISHED")
          .map((t: any) => {
            let fechaEntrega = null;
            if (t.dueDate) {
              fechaEntrega = new Date(
                t.dueDate.year,
                t.dueDate.month - 1,
                t.dueDate.day,
                t.dueTime?.hours ?? 0,
                t.dueTime?.minutes ?? 0
              ).toISOString();
            }
            return {
              id:            t.id,
              titulo:        t.title,
              descripcion:   t.description ?? null,
              fechaEntrega:  fechaEntrega,
              puntosPosibles: t.maxPoints ?? null,
              estado:        "ASIGNADA",
              // Materiales adjuntos con miniaturas
              materiales:   (t.materials ?? []).map((m: any) => {
                if (m.driveFile?.driveFile) {
                  return {
                    tipo:      "DRIVE_FILE",
                    titulo:    m.driveFile.driveFile.title ?? "Archivo Drive",
                    url:       m.driveFile.driveFile.alternateLink,
                    thumbnail: m.driveFile.driveFile.thumbnailUrl,
                  };
                }
                if (m.youtubeVideo) {
                  return {
                    tipo:      "YOUTUBE",
                    titulo:    m.youtubeVideo.title ?? "Video YouTube",
                    url:       `https://youtube.com/watch?v=${m.youtubeVideo.id}`,
                    thumbnail: m.youtubeVideo.thumbnailUrl,
                  };
                }
                if (m.link) {
                  return {
                    tipo:      "LINK",
                    titulo:    m.link.title || m.link.url || "Enlace",
                    url:       m.link.url,
                    thumbnail: m.link.thumbnailUrl,
                  };
                }
                if (m.form) {
                  return {
                    tipo:      "FORM",
                    titulo:    m.form.title ?? "Formulario",
                    url:       m.form.formUrl,
                  };
                }
                return null;
              }).filter(Boolean),
            };
          });
      } catch (err) {
        console.warn("[feed] Error al traer tareas:", err);
      }
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error("[GET /api/classroom/feed]", err);
    return NextResponse.json({ error: "Error interno", clase: null, anuncios: [], tareas: [] }, { status: 500 });
  }
}