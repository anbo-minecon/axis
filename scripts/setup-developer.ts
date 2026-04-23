// scripts/setup-developer.ts
/**
 * Script para crear el usuario Developer (rol especial)
 * 
 * Uso:
 *   npx tsx scripts/setup-developer.ts
 * 
 * O con variables de entorno:
 *   DEVELOPER_EMAIL=dev@example.com DEVELOPER_PASSWORD=password123 npx tsx scripts/setup-developer.ts
 */

import { createDeveloper } from "@/lib/developer-auth";

async function setupDeveloper() {
  console.log("🔧 Iniciando setup del rol Developer...\n");

  // Obtener credenciales del prompt o variables de entorno
  const email =
    process.env.DEVELOPER_EMAIL || "developer@axis-preicfes.local";
  const password =
    process.env.DEVELOPER_PASSWORD || "Developer@2025#Secure";
  const nombre = "Desarrollador Sistema";

  try {
    console.log("📝 Creando usuario Developer...");
    console.log(`   Email: ${email}`);
    console.log(`   Nombre: ${nombre}\n`);

    const result = await createDeveloper(email, nombre, password);

    console.log("✅ Usuario Developer creado exitosamente!\n");
    console.log("📋 Detalles:");
    console.log(`   ID: ${result.usuario.id}`);
    console.log(`   Email: ${result.usuario.email}`);
    console.log(`   Rol: ${result.usuario.rol}`);
    console.log(`   Token Secreto: ${result.developerCred.tokenSecret}`);
    console.log("\n🔐 Token JWT Inicial:");
    console.log(`   ${result.token}\n`);

    console.log("📌 Próximos pasos:");
    console.log("   1. Accede a http://localhost:3000/developer/login");
    console.log(`   2. Email: ${email}`);
    console.log(`   3. Contraseña: ${password}`);
    console.log("\n⚠️  IMPORTANTE:");
    console.log("   - Cambia la contraseña después del primer login");
    console.log("   - Guarda el Token Secreto en un lugar seguro");
    console.log("   - Este rol es invisible en la interfaz regular\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear Developer:", error);
    process.exit(1);
  }
}

setupDeveloper();
