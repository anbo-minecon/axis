// lib/auth.ts
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "./db";
import { z } from "zod";
import { CustomPrismaAdapter } from "./auth-adapter";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleClientId = process.env.GOOGLE_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;
const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

if (!authSecret) {
  console.warn(
    "[Auth] WARNING: NEXTAUTH_SECRET or AUTH_SECRET is not configured. Production JWT/session handling may fail."
  );
}

const providers: any[] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email:    { label: "Email",    type: "email"    },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const parsed = credentialsSchema.parse(credentials);

        const usuario = await db.usuario.findUnique({
          where:   { email: parsed.email },
          include: { suscripcion: true },
        });

        if (!usuario || !usuario.passwordHash) return null;

        const validPassword = await compare(parsed.password, usuario.passwordHash);
        if (!validPassword) return null;

        return {
          id:    usuario.id,
          email: usuario.email,
          name:  usuario.nombre,
          image: usuario.imagen,
          rol:   usuario.rol,
        };
      } catch (error) {
        console.error("[Auth] Error en authorize:", error);
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.unshift(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id:    profile.sub,
          name:  profile.name  ?? "Usuario Google",
          email: profile.email,
          image: profile.picture ?? null,
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: CustomPrismaAdapter(db),
  providers,

  session: {
    strategy: "jwt",
    maxAge:    30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  pages: {
    signIn:  "/auth/login",
    error:   "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Primera vez que se loguea
      if (user) {
        token.id       = user.id;
        token.email    = user.email;
        token.rol      = (user as any).rol ?? "ESTUDIANTE";
        token.provider = account?.provider ?? "credentials";
      }

      // Refrescar datos de BD en cada renovación de token
      if (token.id) {
        try {
          const u = await db.usuario.findUnique({
            where:   { id: token.id as string },
            include: { suscripcion: true },
          });
          if (u) {
            token.tieneSubscripcion = u.suscripcion?.activa ?? false;
            token.rol               = u.rol ?? "ESTUDIANTE";
            token.nombre            = u.nombre;
          }
        } catch {
          token.tieneSubscripcion = false;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = (
          ["ESTUDIANTE", "DOCENTE", "ADMIN", "DEVELOPER"].includes(token.rol as string)
            ? token.rol
            : "ESTUDIANTE"
        ) as any;
        session.user.tieneSubscripcion = (token.tieneSubscripcion as boolean) ?? false;
        if (token.nombre) session.user.name = token.nombre as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  debug: process.env.NODE_ENV === "development",
};