// lib/auth-adapter.ts
// Adapter personalizado para NextAuth que mapea el modelo "Usuario" de Prisma
// al contrato "User" que PrismaAdapter espera.
//
// El problema: PrismaAdapter busca db.user, db.account, db.session, etc.
// Tu BD tiene db.usuario (con campos "nombre" e "imagen" en lugar de "name" e "image").
// Solución: reimplementar solo los métodos que usa Google OAuth.

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";

function toAdapterUser(u: any): AdapterUser {
  return {
    id:            u.id,
    email:         u.email,
    emailVerified: u.emailVerified ?? null,
    name:          u.nombre  ?? null,   // nombre → name
    image:         u.imagen  ?? null,   // imagen → image
  };
}

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // ── Crear usuario nuevo (llamado por Google la primera vez) ───────────────
    async createUser(data: AdapterUser) {
      const user = await prisma.usuario.create({
        data: {
          nombre:        data.name  ?? "Usuario Google",
          email:         data.email,
          emailVerified: data.emailVerified ?? new Date(),
          imagen:        data.image ?? null,
          rol:           "ESTUDIANTE",
        },
      });
      return toAdapterUser(user);
    },

    // ── Buscar usuario por ID ─────────────────────────────────────────────────
    async getUser(id: string) {
      const user = await prisma.usuario.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },

    // ── Buscar usuario por email ──────────────────────────────────────────────
    async getUserByEmail(email: string) {
      const user = await prisma.usuario.findUnique({ where: { email } });
      return user ? toAdapterUser(user) : null;
    },

    // ── Buscar usuario por cuenta OAuth (Google provider) ────────────────────
    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account?.user ? toAdapterUser(account.user) : null;
    },

    // ── Actualizar usuario ────────────────────────────────────────────────────
    async updateUser(data: Partial<AdapterUser>) {
      const user = await prisma.usuario.update({
        where: { id: data.id },
        data: {
          nombre:        data.name          ?? undefined,
          imagen:        data.image         ?? undefined,
          emailVerified: data.emailVerified ?? undefined,
        },
      });
      return toAdapterUser(user);
    },

    // ── Vincular cuenta OAuth al usuario ─────────────────────────────────────
    async linkAccount(data: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId:            data.userId,
          type:              data.type,
          provider:          data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token:     data.refresh_token  as string | undefined,
          access_token:      data.access_token   as string | undefined,
          expires_at:        data.expires_at     as number | undefined,
          token_type:        data.token_type     as string | undefined,
          scope:             data.scope          as string | undefined,
          id_token:          data.id_token       as string | undefined,
          session_state:     data.session_state  as string | undefined,
        },
      });
    },

    // ── Desvincular cuenta OAuth ──────────────────────────────────────────────
    async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    // ── Sesiones (necesarias aunque uses JWT, el adapter las requiere) ────────
    async createSession(data: AdapterSession) {
      const session = await prisma.session.create({ data });
      return session as AdapterSession;
    },

    async getSessionAndUser(sessionToken: string) {
      const result = await prisma.session.findUnique({
        where:   { sessionToken },
        include: { user: true },
      });
      if (!result) return null;
      return {
        session: result as AdapterSession,
        user:    toAdapterUser(result.user),
      };
    },

    async updateSession(data: Partial<AdapterSession>) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      });
      return session as AdapterSession;
    },

    async deleteSession(sessionToken: string) {
      await prisma.session.delete({ where: { sessionToken } }).catch(() => null);
    },

    // ── Tokens de verificación de email ──────────────────────────────────────
    async createVerificationToken(data: { identifier: string; token: string; expires: Date }) {
      return prisma.verificationToken.create({ data });
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const vt = await prisma.verificationToken
        .delete({ where: { identifier_token: { identifier, token } } })
        .catch(() => null);
      return vt;
    },

    // ── Eliminar usuario ──────────────────────────────────────────────────────
    async deleteUser(id: string) {
      await prisma.usuario.delete({ where: { id } }).catch(() => null);
    },
  };
}