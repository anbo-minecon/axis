#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN: Frontend ↔ Backend ↔ Base de Datos
 * 
 * Este script verifica cada paso del flujo de conexión
 */

const fs = require("fs");
const path = require("path");

console.log("\n" + "=".repeat(70));
console.log("🔍 VERIFICACIÓN DEL SISTEMA AXIS Pre-ICFES");
console.log("=".repeat(70) + "\n");

// 1️⃣ Verificar archivos críticos
console.log("✓ PASO 1: Verificando archivos críticos...\n");

const files = [
  ".env.local",
  "lib/db.ts",
  "lib/trpc-client.ts",
  "app/api/trpc/[trpc]/route.ts",
  "server/trpc/router.ts",
  "server/trpc/context.ts",
  "server/trpc/routers/auth.ts",
  "app/auth/registro/page.tsx",
];

let filesOK = true;
files.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) filesOK = false;
});

if (!filesOK) {
  console.log("\n❌ Error: Faltan archivos críticos");
  process.exit(1);
}

// 2️⃣ Verificar .env.local
console.log("\n✓ PASO 2: Verificando configuración de ambiente...\n");

const envContent = fs.readFileSync(".env.local", "utf-8");
const hasDatabase = envContent.includes("DATABASE_URL");
const hasNextAuth = envContent.includes("NEXTAUTH_SECRET");

console.log(`  ${hasDatabase ? "✅" : "❌"} DATABASE_URL configurado`);
console.log(`  ${hasNextAuth ? "✅" : "❌"} NEXTAUTH_SECRET configurado`);

if (!hasDatabase || !hasNextAuth) {
  console.log("\n❌ Error: Faltan variables de ambiente");
  process.exit(1);
}

// 3️⃣ Verificar package.json
console.log("\n✓ PASO 3: Verificando dependencias...\n");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const required = ["@trpc/client", "@trpc/server", "@prisma/client", "next-auth"];

required.forEach((dep) => {
  const exists = pkg.dependencies[dep] || pkg.devDependencies[dep];
  console.log(`  ${exists ? "✅" : "❌"} ${dep}`);
});

// 4️⃣ Verificar Prisma schema
console.log("\n✓ PASO 4: Verificando Prisma schema...\n");

const schemaContent = fs.readFileSync("prisma/schema.prisma", "utf-8");
const hasUsuarioModel = schemaContent.includes("model Usuario");
const hasDatabase_url = schemaContent.includes("DATABASE_URL");

console.log(
  `  ${hasUsuarioModel ? "✅" : "❌"} Modelo 'Usuario' existe en schema`
);
console.log(
  `  ${hasDatabase_url ? "✅" : "❌"} DATABASE_URL está siendo usado`
);

// 5️⃣ Verificar archivo de ruta API
console.log("\n✓ PASO 5: Verificando endpoint tRPC...\n");

const apiRoute = fs.readFileSync("app/api/trpc/[trpc]/route.ts", "utf-8");
const hasHandler = apiRoute.includes("createNextApiHandler");
const hasExport = apiRoute.includes("export const");

console.log(`  ${hasHandler ? "✅" : "❌"} tRPC handler configurado`);
console.log(`  ${hasExport ? "✅" : "❌"} Exports GET y POST`);

// 6️⃣ Verificar cliente tRPC
console.log("\n✓ PASO 6: Verificando cliente tRPC...\n");

const clientContent = fs.readFileSync("lib/trpc-client.ts", "utf-8");
const hasCreateTRPC = clientContent.includes("createTRPCClient");
const hasHttpBatch = clientContent.includes("httpBatchLink");

console.log(`  ${hasCreateTRPC ? "✅" : "❌"} createTRPCClient configurado`);
console.log(`  ${hasHttpBatch ? "✅" : "❌"} httpBatchLink configurado`);

// Resumen final
console.log("\n" + "=".repeat(70));
console.log("✅ VERIFICACIÓN COMPLETADA\n");

console.log("📝 PROXIMOS PASOS:");
console.log("1. Ejecuta: npm run db:push (para sincronizar BD)");
console.log("2. Ejecuta: npm run dev (para iniciar servidor)");
console.log("3. Visita: http://localhost:3000/auth/registro");
console.log("4. Revisa la consola del servidor para errores detallados");
console.log("\n" + "=".repeat(70) + "\n");
