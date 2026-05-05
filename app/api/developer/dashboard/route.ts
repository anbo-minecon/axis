// app/api/developer/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";
import os from "os";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // ── Estadísticas generales del sistema ──────────────────────────────────
    const usuariosTotales = await db.usuario.count();
    const usuariosActivos = await db.usuario.count({
      where: {
        suscripcion: {
          activa: true,
        },
      },
    });

    const porRol = await db.usuario.groupBy({
      by: ["rol"],
      _count: true,
    });

    // Simulacros hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const simulacrosHoy = await db.resultadoSimulacro.count({
      where: {
        completadoEn: {
          gte: hoy,
          lt: manana,
        },
      },
    });

    // Errores en últimas 24h
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errores24h = await db.systemLog.count({
      where: {
        createdAt: { gte: hace24h },
        nivel: "ERROR",
      },
    });

    // ── Métricas reales del servidor ────────────────────────────────────────
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsada = memTotal - memFree;
    const memUsadaGB = parseFloat((memUsada / 1024 / 1024 / 1024).toFixed(2));
    const memPct = Math.round((memUsada / memTotal) * 100);

    // CPU: promedio de carga del último minuto (Linux/Mac) normalizado por núcleos
    const cpuLoad = os.loadavg()[0]; // último 1 minuto
    const cpuCores = os.cpus().length;
    const cpuPct = Math.min(100, Math.round((cpuLoad / cpuCores) * 100));

    const uptimeSegundos = os.uptime(); // uptime del sistema operativo

    // Requests en últimas 24h desde audit logs (proxy real de actividad)
    const requestsHoy = await db.auditLog.count({
      where: { createdAt: { gte: hace24h } },
    });

    // Latencia promedio real desde IntegrationLog (campo correcto: responseTime)
    const integracionesConLatencia = await db.integrationLog.findMany({
      select: { responseTime: true },
      where: { responseTime: { not: null } },
    });
    const latenciaPromedio =
      integracionesConLatencia.length > 0
        ? Math.round(
            integracionesConLatencia.reduce((acc, i) => acc + (i.responseTime ?? 0), 0) /
              integracionesConLatencia.length
          )
        : 0;

    // ── Logs del sistema ────────────────────────────────────────────────────
    const recentLogs = await db.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const logsFormato = recentLogs.map((log) => ({
      id: log.id,
      ts: log.createdAt.toLocaleTimeString("es-CO"),
      lvl: (log.nivel?.toUpperCase() || "INFO") as "ERROR" | "WARN" | "INFO" | "OK",
      comp: log.componente || "Sistema",
      msg: log.mensaje,
    }));

    // ── Auditoría ───────────────────────────────────────────────────────────
    const recentAudit = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { usuario: { select: { nombre: true, email: true } } },
    });

    const auditFormato = recentAudit.map((a) => ({
      id: a.id,
      action: (a.accion || "UPDATE") as "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT",
      user: a.usuario?.email || "sistema",
      resource: a.recurso,
      time: a.createdAt.toLocaleTimeString("es-CO"),
      ip: a.ipAddress || undefined,
    }));

    // ── Respaldos ───────────────────────────────────────────────────────────
    const backups = await db.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const backupFormato = backups.map((b) => ({
      id: b.id,
      tipo: b.tipo || "Automático",
      estado: (b.estado || "COMPLETADO") as "COMPLETADO" | "EN PROGRESO" | "ERROR",
      size: b.tamanio ? `${(b.tamanio / 1024 / 1024).toFixed(0)} MB` : "—",
      dur: b.duracionMs ? `${Math.round(b.duracionMs / 1000)}s` : "—",
      fecha: b.createdAt.toLocaleString("es-CO"),
      // ✅ ARREGLO: incluir ubicacion para que el botón descargar funcione
      ubicacion: b.ubicacion || null,
    }));

    // ── Integraciones ───────────────────────────────────────────────────────
    const integraciones = await db.integrationLog.findMany({
      orderBy: { updatedAt: "desc" },
    });

    const integracionesFormato = integraciones.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      estado: (i.estado || "UP") as "UP" | "DOWN" | "WARN" | "CONECTADO" | "ERROR" | "DEGRADED",
      // ✅ ARREGLO: campo correcto del schema es "responseTime", no "latencia"
      latencia: i.responseTime || 0,
      requestsHoy: i.requestsHoy || 0,
      tasaError: i.tasaError || 0,
      lastCheck: i.updatedAt.toLocaleTimeString("es-CO"),
      mensajeError: i.ultimoError || undefined,
    }));

    return NextResponse.json({
      dashboard: {
        timestamp: new Date(),
        sistema: {
          usuariosTotales,
          usuariosActivos,
          simulacrosHoy,
          errores24h,
          porRol: porRol.map((r) => ({
            rol: r.rol,
            _count: r._count,
          })),
        },
        // ✅ NUEVO: métricas reales del servidor
        servidor: {
          memUsadaGB,
          memPct,
          cpuPct,
          uptimeSegundos,
          requestsHoy,
          latenciaPromedio,
          cpuCores,
          memTotalGB: parseFloat((memTotal / 1024 / 1024 / 1024).toFixed(2)),
        },
        logs: {
          sistema: logsFormato,
          auditoria: auditFormato,
        },
        backups: backupFormato,
        integraciones: integracionesFormato,
      },
    });
  } catch (error) {
    console.error("Error en dashboard developer:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}