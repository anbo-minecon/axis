// lib/developer-auth.ts
import { compare, hash } from "bcryptjs";
import { db } from "./db";
import { randomBytes } from "crypto";

/**
 * Valida credenciales de Developer
 */
export async function validateDeveloperCredentials(
  email: string,
  password: string
) {
  try {
    const usuario = await db.usuario.findUnique({
      where: { email },
      include: { developerCred: true },
    });

    if (!usuario || usuario.rol !== "DEVELOPER") {
      return null;
    }

    if (!usuario.developerCred || !usuario.developerCred.activo) {
      return null;
    }

    const validPassword = await compare(password, usuario.developerCred.passwordHash);

    if (!validPassword) {
      return null;
    }

    // Actualizar último acceso
    await db.developerCredential.update({
      where: { id: usuario.developerCred.id },
      data: {
        ultimoAcceso: new Date(),
        direccionIP: "", // Se establece en el endpoint
      },
    });

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  } catch (error) {
    console.error("Error validating developer credentials:", error);
    return null;
  }
}

/**
 * Genera un token JWT para Developer
 */
export function generateDeveloperToken(usuarioId: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({
      sub: usuarioId,
      rol: "DEVELOPER",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
    })
  ).toString("base64url");

  // Nota: Implementar firma HMAC en producción
  return `${header}.${payload}.signature`;
}

/**
 * Crea un nuevo Developer (solo para setup inicial)
 */
export async function createDeveloper(
  email: string,
  nombre: string,
  password: string
) {
  try {
    // Verificar que no sea usuario existente
    const existing = await db.usuario.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error("Usuario ya existe");
    }

    // Crear usuario con rol DEVELOPER
    const usuario = await db.usuario.create({
      data: {
        email,
        nombre,
        rol: "DEVELOPER",
        emailVerified: new Date(),
      },
    });

    // Crear credenciales de Developer
    const passwordHash = await hash(password, 10);
    const tokenSecret = randomBytes(32).toString("hex");

    const developerCred = await db.developerCredential.create({
      data: {
        usuarioId: usuario.id,
        passwordHash,
        tokenSecret,
      },
    });

    return {
      usuario,
      developerCred,
      token: generateDeveloperToken(usuario.id),
    };
  } catch (error) {
    console.error("Error creating developer:", error);
    throw error;
  }
}

/**
 * Verifica si un usuario es Developer
 */
export async function isDeveloper(usuarioId: string): Promise<boolean> {
  try {
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
    });
    return usuario?.rol === "DEVELOPER";
  } catch {
    return false;
  }
}

/**
 * Registra acción en audit log
 */
export async function logAuditAction(
  usuarioId: string | undefined,
  accion: string,
  recurso: string,
  recursoId?: string,
  mensaje?: string,
  ipAddress?: string
) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId,
        accion,
        recurso,
        recursoId,
        mensaje,
        ip: ipAddress,
        resultado: "EXITOSO",
      },
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
}

/**
 * Registra error en system log
 */
export async function logSystemError(
  nivel: string,
  componente: string,
  mensaje: string,
  detalles?: string,
  stack?: string
) {
  try {
    await db.systemLog.create({
      data: {
        nivel,
        componente,
        mensaje,
        detalles,
        stack,
      },
    });
  } catch (error) {
    console.error("Error logging system error:", error);
  }
}
