// scripts/seed-developer-data.ts
import { db } from "@/lib/db";

async function seedDeveloperData() {
  console.log("🌱 Agregando datos de ejemplo al Developer Dashboard...\n");

  // ── Crear o encontrar usuario admin para auditoria ─────────────────────
  const admin = await db.usuario.findUnique({
    where: { email: "admin@axis.local" },
  });

  if (!admin) {
    console.log("⚠️  No se encontró usuario admin. Ejecuta npm run db:seed primero.");
    process.exit(1);
  }

  // ── System Logs (simulando actividad del sistema) ─────────────────────
  console.log("📝 Creando System Logs...");
  const systemLogs = [
    {
      nivel: "INFO",
      componente: "AuthService",
      mensaje: "JWT rotado correctamente para 48 sesiones activas",
    },
    {
      nivel: "OK",
      componente: "Database",
      mensaje: "Conexión a PostgreSQL establecida exitosamente",
    },
    {
      nivel: "INFO",
      componente: "Scheduler",
      mensaje: "Cron backup automático iniciado",
    },
    {
      nivel: "WARN",
      componente: "Database",
      mensaje: "Pool de conexiones al 78% de capacidad",
    },
    {
      nivel: "INFO",
      componente: "SimEngine",
      mensaje: "Simulacro completado - 12 usuarios",
    },
    {
      nivel: "OK",
      componente: "Cache",
      mensaje: "Redis PING responde correctamente",
    },
    {
      nivel: "INFO",
      componente: "UserService",
      mensaje: "5 nuevos registros completados esta hora",
    },
    {
      nivel: "WARN",
      componente: "MediaService",
      mensaje: "Latencia alta en S3: 2.4s (umbral 2s)",
    },
  ];

  for (const log of systemLogs) {
    await db.systemLog.create({
      data: {
        ...log,
        createdAt: new Date(Date.now() - Math.random() * 3600000), // últimas horas
      },
    });
  }
  console.log(`✨ ${systemLogs.length} logs del sistema creados\n`);

  // ── Audit Logs (actividad administrativa) ────────────────────────────
  console.log("🔍 Creando Audit Logs...");
  const auditLogs = [
    {
      accion: "UPDATE",
      recurso: "pregunta #PQ-2341 - área Matemáticas",
      ipAddress: "192.168.1.100",
    },
    {
      accion: "CREATE",
      recurso: "nuevo simulacro #SIM-3942",
      ipAddress: "192.168.1.100",
    },
    {
      accion: "UPDATE",
      recurso: "plan suscripción usuario id:1204",
      ipAddress: "192.168.1.100",
    },
    {
      accion: "LOGIN",
      recurso: "acceso desde Bogotá",
      ipAddress: "192.168.1.101",
    },
    {
      accion: "DELETE",
      recurso: "usuario id:3892 (cuenta inactiva)",
      ipAddress: "192.168.1.100",
    },
    {
      accion: "EXPORT",
      recurso: "reporte usuarios Q1-2025 (.csv)",
      ipAddress: "127.0.0.1",
    },
  ];

  for (const audit of auditLogs) {
    await db.auditLog.create({
      data: {
        ...audit,
        usuarioId: admin.id,
        createdAt: new Date(Date.now() - Math.random() * 86400000), // últimas 24h
      },
    });
  }
  console.log(`✨ ${auditLogs.length} logs de auditoría creados\n`);

  // ── Backup Logs (historial de respaldos) ─────────────────────────────
  console.log("💾 Creando Backup Logs...");
  const backupLogs = [
    {
      tipo: "Automático",
      estado: "COMPLETADO",
      tamanio: 879000000,
      duracionMs: 252000,
    },
    {
      tipo: "Automático",
      estado: "COMPLETADO",
      tamanio: 875000000,
      duracionMs: 248000,
    },
    {
      tipo: "Manual",
      estado: "COMPLETADO",
      tamanio: 881000000,
      duracionMs: 265000,
    },
    {
      tipo: "Automático",
      estado: "COMPLETADO",
      tamanio: 872000000,
      duracionMs: 245000,
    },
  ];

  for (let i = 0; i < backupLogs.length; i++) {
    await db.backupLog.create({
      data: {
        ...backupLogs[i],
        createdAt: new Date(Date.now() - i * 86400000), // días anteriores
      },
    });
  }
  console.log(`✨ ${backupLogs.length} respaldos registrados\n`);

  // ── Integration Logs (estado de servicios externos) ──────────────────
  console.log("🔗 Creando Integration Logs...");
  const integrations = [
    {
      nombre: "/api/auth",
      estado: "UP",
      latenciaMs: 38,
      mensajeError: null,
    },
    {
      nombre: "/api/simulacros",
      estado: "UP",
      latenciaMs: 142,
      mensajeError: null,
    },
    {
      nombre: "/api/database",
      estado: "UP",
      latenciaMs: 89,
      mensajeError: null,
    },
    {
      nombre: "/api/payments",
      estado: "UP",
      latenciaMs: 62,
      mensajeError: null,
    },
    {
      nombre: "/api/media",
      estado: "WARN",
      latenciaMs: 2400,
      mensajeError: "S3 latencia elevada",
    },
    {
      nombre: "/api/notifications",
      estado: "UP",
      latenciaMs: 89,
      mensajeError: null,
    },
  ];

  for (const integ of integrations) {
    await db.integrationLog.create({
      data: {
        ...integ,
        updatedAt: new Date(Date.now() - Math.random() * 3600000),
      },
    });
  }
  console.log(`✨ ${integrations.length} integraciones registradas\n`);

  console.log("✅ Datos del Developer Dashboard agregados exitosamente!");
  console.log("\n🚀 Ahora accede a: http://localhost:3001/developer/dashboard");
}

seedDeveloperData()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
