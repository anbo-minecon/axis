// types/next-auth.d.ts
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      tieneSubscripcion: boolean;
    };
  }

  interface User {
    id: string;
    tieneSubscripcion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tieneSubscripcion: boolean;
  }
}