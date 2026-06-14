// app/api/classroom/callback/route.ts
// Recibe el código de autorización de Google y guarda los tokens de Classroom

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code    = searchParams.get("code");
  const state   = searchParams.get("state");   // usuarioId
  const error   = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/admin/classroom?error=classroom_denied`
    );
  }

  try {
    // Intercambiar código por tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_ID!,
        client_secret: process.env.GOOGLE_SECRET!,
        redirect_uri:  `${baseUrl}/api/classroom/callback`,
        grant_type:    "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[Classroom callback] Error al obtener token:", err);
      return NextResponse.redirect(
        `${baseUrl}/admin/classroom?error=token_exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    // Guardar o actualizar en BD
    await db.classroomToken.upsert({
      where: { usuarioId: state },
      create: {
        usuarioId:    state,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt:    new Date(Date.now() + tokens.expires_in * 1000),
        scope:        tokens.scope ?? "",
      },
      update: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt:    new Date(Date.now() + tokens.expires_in * 1000),
        scope:        tokens.scope ?? "",
      },
    });

    // Log de auditoría
    await db.auditLog.create({
      data: {
        usuarioId: state,
        accion:    "CONECTAR_CLASSROOM",
        recurso:   "classroom_token",
        resultado: "EXITOSO",
        mensaje:   "Token de Google Classroom guardado exitosamente",
      },
    }).catch(() => {}); // no bloquear si falla el log

    return NextResponse.redirect(
      `${baseUrl}/admin/classroom?connected=true`
    );
  } catch (err) {
    console.error("[Classroom callback] Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/admin/classroom?error=internal_error`
    );
  }
}