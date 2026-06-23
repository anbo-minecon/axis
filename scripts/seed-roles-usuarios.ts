// scripts/seed-roles-usuarios.ts
// Crea (o actualiza) los usuarios base: ADMIN, DEVELOPER y DOCENTE
// Pueden iniciar sesión con email/contraseña, y si más adelante inician
// con Google usando el MISMO correo, NextAuth vincula la cuenta automáticamente
// (allowDangerousEmailAccountLinking: true en lib/auth.ts).

import { hash } from "bcryptjs";
import { db } from "@/lib/db";

async function main() {
  console.log("🌱 Creando usuarios base (ADMIN, DEVELOPER, DOCENTE)...\n");

  const usuarios = [
    {
      email: "admin@axis.local",
      nombre: "Administrador Axis",
      rol: "ADMIN" as const,
      password: "Password123",
    },
    {
      email: "developer@axis.local",
      nombre: "Developer Axis",
      rol: "DEVELOPER" as const,
      password: "anbo2019",
    },
    {
      email: "docente@axis.local",
      nombre: "Docente Demo",
      rol: "DOCENTE" as const,
      password: "Password123",
    },
  ];

  for (const u of usuarios) {
    const passwordHash = await hash(u.password, 10);

    const usuario = await db.usuario.upsert({
      where: { email: u.email },
      update: {
        nombre: u.nombre,
        rol: u.rol,
        passwordHash,
      },
      create: {
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    console.log(`✅ ${u.rol.padEnd(10)} -> ${usuario.email}  (password: ${u.password})`);
  }

  console.log("\n🚀 Listo. Inicia sesión con email + contraseña en /auth/login");
  console.log("   (o con Google usando el mismo correo, si lo configuras como cuenta real de Google)\n");
  console.log("⚠️  IMPORTANTE: cambia estas contraseñas después de tu primer login.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
