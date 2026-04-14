// lib/auth.ts
// Configuración de NextAuth v4
import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "./db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.parse(credentials);
          const usuario = await db.usuario.findUnique({
            where: { email: parsed.email },
            include: { suscripcion: true },
          });

          if (!usuario || !usuario.passwordHash) {
            console.log("❌ Usuario no encontrado o sin hash:", parsed.email);
            return null;
          }

          const validPassword = await compare(
            parsed.password,
            usuario.passwordHash
          );

          if (!validPassword) {
            console.log("❌ Contraseña inválida para:", parsed.email);
            return null;
          }

          console.log("✅ Usuario autenticado:", parsed.email);
          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre,
            image: usuario.imagen,
          };
        } catch (error) {
          console.error("❌ Error en authorize:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar cada 24 horas
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/registro",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Obtener suscripción en cada JWT refresh
      if (token.id) {
        try {
          const suscripcion = await db.suscripcion.findUnique({
            where: { usuarioId: token.id as string },
          });
          token.tieneSubscripcion = suscripcion?.activa ?? false;
        } catch (error) {
          console.error("Error al obtener suscripción:", error);
          token.tieneSubscripcion = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tieneSubscripcion = (token.tieneSubscripcion as boolean) ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permitir redirecciones en el mismo sitio
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permitir si es del mismo origen
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
