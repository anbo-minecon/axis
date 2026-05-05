// app/api/developer/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateDeveloperCredentials, generateDeveloperToken } from "@/lib/developer-auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const usuario = await validateDeveloperCredentials(email, password);

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = generateDeveloperToken(usuario.id);

    // Crear respuesta con el token
    const response = NextResponse.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });

    // Establecer cookie con el token (24 horas)
    response.cookies.set({
      name: "developer_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas en segundos
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en login de developer:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
