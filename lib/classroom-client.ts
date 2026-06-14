// lib/classroom-client.ts
// Cliente para la API de Google Classroom
// Maneja autenticación, refresh de tokens y llamadas a la API

import { db } from "./db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CLASSROOM_BASE   = "https://classroom.googleapis.com/v1";

// ── Tipos básicos de la API de Google Classroom ───────────────────────────────

export interface GCourse {
  id:          string;
  name:        string;
  description?: string;
  section?:    string;
  courseState: "ACTIVE" | "ARCHIVED" | "PROVISIONED" | "DECLINED";
  alternateLink: string;
}

export interface GStudent {
  userId: string;
  profile: {
    name: { fullName: string };
    emailAddress: string;
    photoUrl?: string;
  };
}

export interface GCourseWork {
  id:          string;
  title:       string;
  description?: string;
  state:       "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink: string;
  dueDate?:    { year: number; month: number; day: number };
  maxPoints?:  number;
  workType:    "ASSIGNMENT" | "SHORT_ANSWER_QUESTION" | "MULTIPLE_CHOICE_QUESTION";
}

export interface GAnnouncement {
  id:    string;
  text:  string;
  state: "PUBLISHED" | "DRAFT" | "DELETED";
  creationTime: string;
  alternateLink: string;
}

// ── Obtener token vigente (refresca automáticamente si expiró) ────────────────

async function getValidToken(usuarioId: string): Promise<string> {
  const stored = await db.classroomToken.findUnique({
    where: { usuarioId },
  });

  if (!stored) {
    throw new Error("No hay token de Classroom para este usuario. Conecta primero tu cuenta.");
  }

  // Si aún no expiró (con 60s de margen), usar directamente
  const margen = 60 * 1000;
  if (stored.expiresAt.getTime() - margen > Date.now()) {
    return stored.accessToken;
  }

  // Refrescar token
  if (!stored.refreshToken) {
    throw new Error("El token de Classroom expiró y no hay refresh token. Reconecta tu cuenta.");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ID!,
      client_secret: process.env.GOOGLE_SECRET!,
      grant_type:    "refresh_token",
      refresh_token: stored.refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al refrescar token de Classroom: ${err}`);
  }

  const data = await res.json();

  // Guardar nuevo access token
  await db.classroomToken.update({
    where: { usuarioId },
    data: {
      accessToken: data.access_token,
      expiresAt:   new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

// ── Helper para llamadas autenticadas ────────────────────────────────────────

async function gcall<T>(
  usuarioId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidToken(usuarioId);

  const res = await fetch(`${CLASSROOM_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Classroom API error ${res.status}: ${err}`);
  }

  // 204 No Content no tiene cuerpo
  if (res.status === 204) return {} as T;

  return res.json();
}

// ── CURSOS ────────────────────────────────────────────────────────────────────

/** Lista todos los cursos del usuario (como teacher) */
export async function listarCursos(usuarioId: string): Promise<GCourse[]> {
  const data = await gcall<{ courses?: GCourse[] }>(
    usuarioId,
    "/courses?teacherId=me&pageSize=50"
  );
  return data.courses ?? [];
}

/** Crea un curso nuevo en Google Classroom */
export async function crearCurso(
  usuarioId: string,
  nombre: string,
  seccion?: string,
  descripcion?: string
): Promise<GCourse> {
  return gcall<GCourse>(usuarioId, "/courses", {
    method: "POST",
    body: JSON.stringify({
      name:        nombre,
      section:     seccion,
      description: descripcion,
      ownerId:     "me",
    }),
  });
}

/** Actualiza nombre/descripción de un curso */
export async function actualizarCurso(
  usuarioId: string,
  googleCourseId: string,
  datos: { name?: string; description?: string; section?: string }
): Promise<GCourse> {
  const fields = Object.keys(datos).join(",");
  return gcall<GCourse>(
    usuarioId,
    `/courses/${googleCourseId}?updateMask=${fields}`,
    { method: "PATCH", body: JSON.stringify(datos) }
  );
}

/** Archiva un curso (no lo elimina de Google, lo marca ARCHIVED) */
export async function archivarCurso(
  usuarioId: string,
  googleCourseId: string
): Promise<GCourse> {
  return gcall<GCourse>(
    usuarioId,
    `/courses/${googleCourseId}?updateMask=courseState`,
    { method: "PATCH", body: JSON.stringify({ courseState: "ARCHIVED" }) }
  );
}

// ── ESTUDIANTES ───────────────────────────────────────────────────────────────

/** Lista estudiantes de un curso */
export async function listarEstudiantes(
  usuarioId: string,
  googleCourseId: string
): Promise<GStudent[]> {
  const data = await gcall<{ students?: GStudent[] }>(
    usuarioId,
    `/courses/${googleCourseId}/students?pageSize=200`
  );
  return data.students ?? [];
}

/** Invita un estudiante a un curso por email */
export async function invitarEstudiante(
  usuarioId: string,
  googleCourseId: string,
  email: string
): Promise<void> {
  await gcall(usuarioId, "/invitations", {
    method: "POST",
    body: JSON.stringify({
      courseId: googleCourseId,
      userId:   email,
      role:     "STUDENT",
    }),
  });
}

// ── TAREAS (COURSEWORK) ───────────────────────────────────────────────────────

/** Lista tareas de un curso */
export async function listarTareas(
  usuarioId: string,
  googleCourseId: string
): Promise<GCourseWork[]> {
  const data = await gcall<{ courseWork?: GCourseWork[] }>(
    usuarioId,
    `/courses/${googleCourseId}/courseWork?pageSize=50`
  );
  return data.courseWork ?? [];
}

/** Crea una tarea en Google Classroom */
export async function crearTarea(
  usuarioId: string,
  googleCourseId: string,
  datos: {
    titulo:      string;
    descripcion?: string;
    linkUrl?:    string;
    fechaEntrega?: Date;
    puntos?:     number;
  }
): Promise<GCourseWork> {
  const body: Record<string, any> = {
    title:       datos.titulo,
    description: datos.descripcion,
    state:       "PUBLISHED",
    workType:    "ASSIGNMENT",
    maxPoints:   datos.puntos ?? 100,
  };

  if (datos.linkUrl) {
    body.materials = [{ link: { url: datos.linkUrl, title: datos.titulo } }];
  }

  if (datos.fechaEntrega) {
    const d = datos.fechaEntrega;
    body.dueDate = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    body.dueTime = { hours: 23, minutes: 59 };
  }

  return gcall<GCourseWork>(
    usuarioId,
    `/courses/${googleCourseId}/courseWork`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

// ── ANUNCIOS ──────────────────────────────────────────────────────────────────

/** Publica un anuncio en un curso */
export async function publicarAnuncio(
  usuarioId: string,
  googleCourseId: string,
  texto: string
): Promise<GAnnouncement> {
  return gcall<GAnnouncement>(
    usuarioId,
    `/courses/${googleCourseId}/announcements`,
    {
      method: "POST",
      body: JSON.stringify({ text: texto, state: "PUBLISHED" }),
    }
  );
}

// ── SCOPES requeridos para Classroom ─────────────────────────────────────────
// Usar en el flujo de conexión OAuth adicional (no en el login normal)

export const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.rosters",
  "https://www.googleapis.com/auth/classroom.announcements",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "offline_access", // para obtener refresh_token
].join(" ");