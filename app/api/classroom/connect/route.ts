// app/api/classroom/connect/route.ts
// Inicia el flujo OAuth para autorizar acceso a Google Classroom
// Separado del login normal — solicita scopes adicionales de Classroom

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CLASSROOM_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.rosters",
  "https://www.googleapis.com/auth/classroom.announcements",
  "https://www.googleapis.com/auth/classroom.profile.emails",
].join(" ");

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Solo ADMIN y DOCENTE pueden conectar Classroom
  const rol = session.user.rol;
  if (rol !== "ADMIN" && rol !== "DOCENTE") {
    return NextResponse.json(
      { error: "Solo administradores y docentes pueden conectar Classroom" },
      { status: 403 }
    );
  }

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_ID!,
    redirect_uri:  `${process.env.NEXTAUTH_URL}/api/classroom/callback`,
    response_type: "code",
    scope:         CLASSROOM_SCOPES,
    access_type:   "offline",   // obtener refresh_token
    prompt:        "consent",   // forzar pantalla de consentimiento para obtener refresh_token
    state:         session.user.id, // pasar userId para guardarlo en callback
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(url);
}