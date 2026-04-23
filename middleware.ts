import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  const rol = token?.rol as string | undefined;
  const tieneSubscripcion = token?.tieneSubscripcion as boolean ?? false;

  // 1. Redirect usuarios logueados lejos del login/registro
  if (
    (pathname === "/auth/login" || pathname === "/auth/registro") &&
    token
  ) {
    // Redirigir según su rol
    if (rol === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (rol === "DOCENTE") {
      return NextResponse.redirect(new URL("/docente/dashboard", request.url));
    }
    if (rol === "DEVELOPER") {
      return NextResponse.redirect(new URL("/developer/dashboard", request.url));
    }
    if (rol === "ESTUDIANTE") {
      if (tieneSubscripcion) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard/planes", request.url));
      }
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Proteger rutas de admin
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${pathname}`, request.url)
      );
    }
    if (rol !== "ADMIN") {
      // No es admin, redirigir a su dashboard según su rol
      if (rol === "DOCENTE") {
        return NextResponse.redirect(new URL("/docente/dashboard", request.url));
      }
      if (rol === "DEVELOPER") {
        return NextResponse.redirect(new URL("/developer/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Proteger rutas de docente
  if (pathname.startsWith("/docente")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${pathname}`, request.url)
      );
    }
    if (rol !== "DOCENTE") {
      // No es docente, redirigir a su dashboard según su rol
      if (rol === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (rol === "DEVELOPER") {
        return NextResponse.redirect(new URL("/developer/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Proteger rutas de developer
  if (pathname.startsWith("/developer")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${pathname}`, request.url)
      );
    }
    if (rol !== "DEVELOPER") {
      // No es developer, redirigir a su dashboard según su rol
      if (rol === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (rol === "DOCENTE") {
        return NextResponse.redirect(new URL("/docente/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 5. Proteger rutas de dashboard (estudiante)
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${pathname}`, request.url)
      );
    }
    // Los roles especiales no deben estar acá
    if (rol === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (rol === "DOCENTE") {
      return NextResponse.redirect(new URL("/docente/dashboard", request.url));
    }
    if (rol === "DEVELOPER") {
      return NextResponse.redirect(new URL("/developer/dashboard", request.url));
    }
    // Estudiante sin suscripción solo puede ir a /dashboard/planes
    if (
      pathname === "/dashboard" &&
      rol === "ESTUDIANTE" &&
      !tieneSubscripcion
    ) {
      return NextResponse.redirect(new URL("/dashboard/planes", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/docente/:path*",
    "/developer/:path*",
    "/auth/login",
    "/auth/registro",
  ],
};
