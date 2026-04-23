// types/auth.ts
import "next-auth";

export type UserRole = "ESTUDIANTE" | "DOCENTE" | "ADMIN" | "DEVELOPER";

declare module "next-auth" {
  interface User {
    id: string;
    rol?: UserRole;
    tieneSubscripcion?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      rol: UserRole;
      tieneSubscripcion?: boolean;
    };
  }

  interface JWT {
    id: string;
    rol: UserRole;
    tieneSubscripcion?: boolean;
  }
}
