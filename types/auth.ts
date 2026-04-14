// types/auth.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    tieneSubscripcion?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      tieneSubscripcion?: boolean;
    };
  }

  interface JWT {
    id: string;
    tieneSubscripcion?: boolean;
  }
}
