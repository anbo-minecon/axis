// components/developer/DeveloperDashboard.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DeveloperPerfilTab } from "./DeveloperPerfilTab";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiEndpoint {
  id: string;
  name: string;
  estado: string;
  latencia: number;
  p95: number;
  requestsHoy: number;
  tasaError: number;
  mensajeError?: string;
  lastCheck: string;
}

interface LogEntry {
  id: string;
  ts: string;
  lvl: "ERROR" | "WARN" | "INFO" | "OK";
  comp: string;
  msg: string;
}

interface AuditEntry {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT";
  user: string;
  resource: string;
  time: string;
  ip?: string;
}

interface BackupEntry {
  id: string;
  tipo: string;
  estado: "COMPLETADO" | "EN PROGRESO" | "ERROR";
  size: string;
  dur: string;
  fecha: string;
  ubicacion: string | null;
}

interface ServidorMetrics {
  memUsadaGB: number;
  memPct: number;
  cpuPct: number;
  uptimeSegundos: number;
  requestsHoy: number;
  latenciaPromedio: number;
  cpuCores: number;
  memTotalGB: number;
}

interface DashboardData {
  sistema: {
    usuariosTotales: number;
    usuariosActivos: number;
    simulacrosHoy: number;
    errores24h: number;
    porRol: Array<{ rol: string; _count: number }>;
  };
  servidor: ServidorMetrics;
  logs: { sistema: LogEntry[]; auditoria: AuditEntry[] };
  backups: BackupEntry[];
  integraciones: any[];
}

type Tab = "overview" | "apis" | "logs" | "audit" | "backups" | "perfil";
type LogLevel = "ALL" | "ERROR" | "WARN" | "INFO" | "OK";

// ─── Spark Chart ──────────────────────────────────────────────────────────────
function SparkChart({ data, color, height = 48 }: { data: number[]; color: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.offsetWidth || 200;
    const H = height;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / range) * (H - 8) - 4,
    }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cp = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cp, pts[i - 1].y, cp, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle =
      color === "#3b82f6" ? "rgba(59,130,246,0.08)" :
      color === "#a78bfa" ? "rgba(167,139,250,0.08)" :
      color === "#f59e0b" ? "rgba(245,158,11,0.08)" :
      "rgba(20,184,166,0.08)";
    ctx.fill();
  }, [data, color, height]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: `${height}px`, display: "block" }} />;
}

// ─── Status Pills ─────────────────────────────────────────────────────────────
function StatusPill({ estado }: { estado: string }) {
  const up = estado === "CONECTADO" || estado === "UP";
  const warn = estado === "DEGRADED" || estado === "WARN";
  const cfg = up
    ? { bg: "rgba(34,197,94,.12)", color: "#22c55e", border: "rgba(34,197,94,.25)", label: "UP" }
    : warn
    ? { bg: "rgba(245,158,11,.12)", color: "#f59e0b", border: "rgba(245,158,11,.25)", label: "WARN" }
    : { bg: "rgba(239,68,68,.12)", color: "#ef4444", border: "rgba(239,68,68,.25)", label: "DOWN" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      ● {cfg.label}
    </span>
  );
}

// ─── Log Level Badge ──────────────────────────────────────────────────────────
function LvlBadge({ lvl }: { lvl: LogEntry["lvl"] }) {
  const cfg = {
    ERROR: { bg: "rgba(239,68,68,.15)", color: "#ef4444" },
    WARN: { bg: "rgba(245,158,11,.15)", color: "#f59e0b" },
    INFO: { bg: "rgba(59,130,246,.15)", color: "#60a5fa" },
    OK: { bg: "rgba(34,197,94,.15)", color: "#22c55e" },
  }[lvl];
  return (
    <span style={{ width: 38, textAlign: "center", borderRadius: 3, padding: "1px 0", fontWeight: 700, fontSize: 9, flexShrink: 0, background: cfg.bg, color: cfg.color, fontFamily: "monospace" }}>
      {lvl}
    </span>
  );
}

// ─── Uptime Bar (determinista, no random) ────────────────────────────────────
function UptimeBar({ tasaError }: { tasaError: number }) {
  // tasaError es % de errores (0-100), usamos para pintar barras
  const bars = Array.from({ length: 20 }, (_, i) => {
    // Distribuir errores uniformemente de forma determinista
    const errorThreshold = tasaError / 100;
    const ok = (i / 20) > errorThreshold || tasaError === 0;
    return ok;
  });
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
      {bars.map((ok, i) => (
        <div key={i} style={{ width: 6, height: 20, borderRadius: 2, background: ok ? "#22c55e" : "#ef4444", opacity: ok ? 0.7 : 1 }} />
      ))}
    </div>
  );
}

// ─── Uptime formateado desde segundos ────────────────────────────────────────
function formatUptime(segundos: number): string {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ tab, active, onClick, children, badge }: { tab: Tab; active: boolean; onClick: () => void; children: React.ReactNode; badge?: number }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", color: active ? "#60a5fa" : "#8fa0bc", fontSize: 12, background: active ? "rgba(59,130,246,.1)" : "transparent", border: active ? "1px solid rgba(59,130,246,.2)" : "1px solid transparent", width: "100%", textAlign: "left", marginBottom: 1, transition: "all .15s" }}>
      {children}
      {badge !== undefined && badge > 0 && (
        <span style={{ marginLeft: "auto", background: "rgba(239,68,68,.15)", color: "#ef4444", borderRadius: 10, padding: "1px 5px", fontSize: 10 }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DeveloperDashboard({ initialTab = "overview" }: { initialTab?: Tab } = {}) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [logFilter, setLogFilter] = useState<LogLevel>("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [clock, setClock] = useState("");

  // Historial de métricas reales del servidor (para los spark charts)
  const [sparkCpu, setSparkCpu] = useState<number[]>([]);
  const [sparkMem, setSparkMem] = useState<number[]>([]);
  const [sparkLat, setSparkLat] = useState<number[]>([]);
  const [sparkReq, setSparkReq] = useState<number[]>([]);

  // ── Fetch datos del API ──────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const token = localStorage.getItem("developer_token");
      if (!token) { router.push("/developer/login"); return; }

      const hdr = { Authorization: `Bearer ${token}` };

      // Pedimos dashboard y logs en paralelo
      const [dashRes, sysRes, auditRes] = await Promise.all([
        fetch("/api/developer/dashboard", { headers: hdr, cache: "no-store" }),
        fetch("/api/developer/system-logs?page=1&limit=100", { headers: hdr, cache: "no-store" }),
        fetch("/api/developer/audit-logs?page=1&limit=50", { headers: hdr, cache: "no-store" }),
      ]);

      if (!dashRes.ok) {
        if (dashRes.status === 401) router.push("/developer/login");
        return;
      }

      const dashJson = await dashRes.json();
      const d: DashboardData = dashJson.dashboard || ({} as DashboardData);

      // Mapear system logs a la forma interna
      let sistemaLogs: LogEntry[] = [];
      try {
        if (sysRes.ok) {
          const sysJson = await sysRes.json();
          sistemaLogs = (sysJson.logs || []).map((l: any) => ({
            id: l.id,
            ts: l.createdAt ? new Date(l.createdAt).toLocaleString() : (l.ts || ""),
            lvl: ((String(l.nivel || l.level || "INFO").toUpperCase() === "ERROR") ? "ERROR" : (String(l.nivel || l.level || "INFO").toUpperCase() === "WARN") ? "WARN" : (String(l.nivel || l.level || "INFO").toUpperCase() === "OK") ? "OK" : "INFO") as LogEntry["lvl"],
            comp: l.componente || l.comp || l.component || "system",
            msg: l.mensaje || l.msg || l.message || JSON.stringify(l),
          }));
        }
      } catch (e) {
        console.error("Error parsing system logs:", e);
      }

      // Mapear audit logs
      let auditLogs: AuditEntry[] = [];
      try {
        if (auditRes.ok) {
          const auditJson = await auditRes.json();
          auditLogs = (auditJson.logs || []).map((a: any) => ({
            id: a.id,
            action: (String(a.accion || a.action || "UPDATE").toUpperCase()) as AuditEntry["action"],
            user: (a.usuario && (a.usuario.nombre || a.usuario.email)) || a.user || "system",
            resource: a.recurso || a.resource || "",
            time: a.createdAt ? new Date(a.createdAt).toLocaleString() : (a.time || ""),
            ip: a.ip || undefined,
          }));
        }
      } catch (e) {
        console.error("Error parsing audit logs:", e);
      }

      // Garantizar que exista la propiedad logs y asignar los logs obtenidos
      d.logs = d.logs || { sistema: [], auditoria: [] };
      d.logs.sistema = sistemaLogs;
      d.logs.auditoria = auditLogs;

      setData(d);

      // ✅ Alimentar spark charts con datos REALES del servidor
      if (d.servidor) {
        setSparkCpu((prev) => [...prev.slice(-29), d.servidor.cpuPct]);
        setSparkMem((prev) => [...prev.slice(-29), d.servidor.memUsadaGB]);
        setSparkLat((prev) => [...prev.slice(-29), d.servidor.latenciaPromedio]);
        setSparkReq((prev) => [...prev.slice(-29), d.servidor.requestsHoy]);
      }
    } catch (e) {
      console.error("Error fetching dashboard:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh cada 30 segundos (métricas reales)
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Reloj
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-CO"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    localStorage.removeItem("developer_user");
    router.push("/developer/login");
  };

  // ── Datos derivados ───────────────────────────────────────────────────────
  const LOGS: LogEntry[] = data?.logs?.sistema || [];
  const AUDIT: AuditEntry[] = data?.logs?.auditoria || [];
  const BACKUPS: BackupEntry[] = data?.backups || [];

  // ✅ ARREGLO: mapear integraciones usando campos correctos del schema
  const APIS: ApiEndpoint[] = data?.integraciones?.map((int: any) => ({
    id: int.id,
    name: int.nombre,
    estado: int.estado,
    latencia: int.latencia || 0,           // ya viene mapeado desde el route
    p95: int.latencia ? Math.round(int.latencia * 1.4) : 0, // estimación P95
    requestsHoy: int.requestsHoy || 0,
    tasaError: int.tasaError || 0,
    mensajeError: int.mensajeError,
    lastCheck: int.lastCheck,
  })) || [];

  const errorCount = LOGS.filter((l) => l.lvl === "ERROR").length;
  const filteredLogs = LOGS.filter((l) => {
    if (logFilter !== "ALL" && l.lvl !== logFilter) return false;
    if (logSearch && !l.msg.toLowerCase().includes(logSearch.toLowerCase()) && !l.comp.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = {
    shell: { display: "flex", height: "100vh", overflow: "hidden", background: "#0f1117", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: 13 } as React.CSSProperties,
    sidebar: { width: 200, background: "#161b27", borderRight: "1px solid #2a3347", display: "flex", flexDirection: "column", flexShrink: 0 } as React.CSSProperties,
    main: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" } as React.CSSProperties,
    topbar: { background: "#161b27", borderBottom: "1px solid #2a3347", padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 48, flexShrink: 0 } as React.CSSProperties,
    content: { padding: 16, flex: 1 } as React.CSSProperties,
    card: { background: "#161b27", border: "1px solid #2a3347", borderRadius: 8, padding: "12px 14px" } as React.CSSProperties,
    sectionTitle: { fontSize: 10, fontWeight: 600, color: "#8fa0bc", textTransform: "uppercase" as const, letterSpacing: ".7px" },
    btn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 500, border: "1px solid #344060", background: "transparent", color: "#8fa0bc", fontFamily: "inherit" } as React.CSSProperties,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f1117" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "2px solid #2a3347", borderTopColor: "#3b82f6", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#546280", fontSize: 12, fontFamily: "monospace" }}>inicializando panel...</p>
        </div>
      </div>
    );
  }

  const srv = data?.servidor;

  return (
    <div style={css.shell}>
      {/* ── Sidebar ── */}
      <aside style={css.sidebar}>
        <div style={{ padding: 16, borderBottom: "1px solid #2a3347", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>DEV</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Axis Dev</div>
            <div style={{ fontSize: 10, color: "#546280" }}>v2.4.1</div>
          </div>
        </div>
        <nav style={{ padding: 8, flex: 1 }}>
          <div style={{ ...css.sectionTitle, padding: "8px 8px 4px" }}>Sistema</div>
          <NavItem tab="overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/></svg>
            Resumen
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginLeft: "auto", animation: "pulse 2s infinite" }} />
          </NavItem>
          <NavItem tab="apis" active={activeTab === "apis"} onClick={() => setActiveTab("apis")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1"/></svg>
            APIs &amp; Servicios
          </NavItem>
          <div style={{ ...css.sectionTitle, padding: "12px 8px 4px" }}>Diagnóstico</div>
          <NavItem tab="logs" active={activeTab === "logs"} onClick={() => setActiveTab("logs")} badge={errorCount}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="1.5" rx=".75" fill="currentColor"/><rect x="2" y="7" width="9" height="1.5" rx=".75" fill="currentColor"/><rect x="2" y="11" width="11" height="1.5" rx=".75" fill="currentColor"/></svg>
            Logs del Sistema
          </NavItem>
          <NavItem tab="audit" active={activeTab === "audit"} onClick={() => setActiveTab("audit")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 6h5l-4 3 1.5 5L8 11 3.5 14 5 9 1 6h5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
            Auditoría
          </NavItem>
          <div style={{ ...css.sectionTitle, padding: "12px 8px 4px" }}>Infraestructura</div>
          <NavItem tab="backups" active={activeTab === "backups"} onClick={() => setActiveTab("backups")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Respaldos
          </NavItem>
          <div style={{ ...css.sectionTitle, padding: "12px 8px 4px" }}>Cuenta</div>
          <NavItem tab="perfil" active={activeTab === "perfil"} onClick={() => setActiveTab("perfil")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Mi Perfil
          </NavItem>
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid #2a3347" }}>
          <div style={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 6, padding: 8 }}>
            <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: 12 }}>dev@axis.edu.co</div>
            <div style={{ color: "#546280", fontSize: 10, marginTop: 2 }}>Rol: DEVELOPER</div>
            <button onClick={handleLogout} style={{ ...css.btn, width: "100%", marginTop: 8, justifyContent: "center", background: "rgba(239,68,68,.1)", borderColor: "rgba(239,68,68,.25)", color: "#ef4444" }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={css.main}>
        <div style={css.topbar}>
          <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
            {{ overview: "Resumen del Sistema", apis: "APIs & Servicios", logs: "Logs del Sistema", audit: "Registro de Auditoría", backups: "Gestión de Respaldos", perfil: "Mi Perfil" }[activeTab]}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#22c55e" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
            En vivo
          </span>
          <span style={{ fontSize: 11, color: "#546280", fontFamily: "monospace" }}>{clock}</span>
          {/* ✅ ARREGLO: botón Actualizar funcional */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ ...css.btn, color: refreshing ? "#546280" : "#8fa0bc" }}
          >
            <span style={refreshing ? { display: "inline-block", animation: "spin .8s linear infinite" } : {}}>↺</span>
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <style>{`
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
          @keyframes spin{to{transform:rotate(360deg)}}
          ::-webkit-scrollbar{width:4px}
          ::-webkit-scrollbar-track{background:#0f1117}
          ::-webkit-scrollbar-thumb{background:#2a3347;border-radius:2px}
        `}</style>

        <div style={css.content}>

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div>
              {/* Stats reales */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Usuarios Totales", value: (data?.sistema.usuariosTotales ?? 0).toLocaleString(), sub: data?.sistema.porRol ? `${data.sistema.porRol.find((r: any) => r.rol === "ESTUDIANTE")?._count || 0} estudiantes` : "—", color: "#e2e8f0", subColor: "#546280" },
                  { label: "Activos Ahora", value: data?.sistema.usuariosActivos ?? 0, sub: "con suscripción activa", color: "#22c55e", subColor: "#546280" },
                  { label: "Simulacros Hoy", value: data?.sistema.simulacrosHoy ?? 0, sub: "completados", color: "#e2e8f0", subColor: "#546280" },
                  { label: "Errores (24h)", value: data?.sistema.errores24h ?? 0, sub: data?.sistema.errores24h && data.sistema.errores24h > 0 ? "requieren atención" : "sistema limpio", color: data?.sistema.errores24h && data.sistema.errores24h > 0 ? "#ef4444" : "#22c55e", subColor: data?.sistema.errores24h && data.sistema.errores24h > 0 ? "#ef4444" : "#22c55e" },
                ].map((s) => (
                  <div key={s.label} style={css.card}>
                    <div style={{ fontSize: 10, color: "#546280", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: s.color, letterSpacing: -1 }}>{s.value}</div>
                    <div style={{ fontSize: 10, marginTop: 4, color: s.subColor }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* ✅ Métricas reales del servidor con spark charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Req. hoy (audit)", val: (srv?.requestsHoy ?? 0).toLocaleString(), data: sparkReq, color: "#3b82f6", sub: `${srv?.cpuCores ?? "—"} núcleos CPU` },
                  { label: "Latencia promedio", val: srv?.latenciaPromedio ? `${srv.latenciaPromedio}ms` : "—", data: sparkLat, color: "#a78bfa", sub: "desde integraciones" },
                  { label: "CPU del servidor", val: srv?.cpuPct !== undefined ? `${srv.cpuPct}%` : "—", data: sparkCpu, color: "#f59e0b", sub: `load avg real` },
                  { label: "Memoria usada", val: srv ? `${srv.memUsadaGB} GB` : "—", data: sparkMem, color: "#14b8a6", sub: srv ? `de ${srv.memTotalGB} GB (${srv.memPct}%)` : "—" },
                ].map((s) => (
                  <div key={s.label} style={css.card}>
                    <div style={{ fontSize: 10, color: "#546280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#344060", marginBottom: 6 }}>{s.sub}</div>
                    {s.data.length >= 2 && <SparkChart data={s.data} color={s.color} />}
                  </div>
                ))}
              </div>

              {/* Uptime del servidor */}
              {srv && (
                <div style={{ ...css.card, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#546280", textTransform: "uppercase", letterSpacing: ".6px" }}>Uptime del servidor</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#22c55e", marginTop: 4 }}>{formatUptime(srv.uptimeSegundos)}</div>
                  </div>
                  <div style={{ width: 1, height: 32, background: "#2a3347" }} />
                  <div style={{ fontSize: 10, color: "#546280" }}>
                    Última actualización: <span style={{ color: "#8fa0bc" }}>{clock}</span>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 10, color: "#546280" }}>
                    Auto-refresh cada <span style={{ color: "#8fa0bc" }}>30s</span>
                  </div>
                </div>
              )}

              {/* Quick API table */}
              <div style={{ ...css.sectionTitle, marginBottom: 8 }}>Estado rápido de APIs</div>
              <div style={{ background: "#161b27", border: "1px solid #2a3347", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#1e2535" }}>
                      {["Servicio", "Estado", "Latencia", "Req/hoy", "Tasa error", "Última verif."].map((h, i) => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: i > 1 ? "right" : "left", color: "#546280", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {APIS.map((a) => (
                      <tr key={a.id} style={{ borderTop: "1px solid #2a3347" }}>
                        <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#e2e8f0" }}>{a.name}</td>
                        <td style={{ padding: "7px 12px" }}><StatusPill estado={a.estado} /></td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", color: a.latencia > 1000 ? "#ef4444" : a.latencia > 500 ? "#f59e0b" : "#e2e8f0" }}>{a.latencia > 0 ? `${a.latencia}ms` : "—"}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace" }}>{a.requestsHoy.toLocaleString()}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", color: a.tasaError > 0 ? "#ef4444" : "#e2e8f0" }}>{a.tasaError > 0 ? `${a.tasaError}%` : "0%"}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", color: "#546280" }}>{a.lastCheck}</td>
                      </tr>
                    ))}
                    {APIS.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#546280" }}>Sin integraciones registradas</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ APIs ═════════════════════════════════════════════════════════ */}
          {activeTab === "apis" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {APIS.map((a) => (
                <div key={a.id} style={css.card}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, fontFamily: "monospace", color: "#e2e8f0" }}>{a.name}</div>
                      {a.mensajeError && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 2 }}>⚠ {a.mensajeError}</div>}
                    </div>
                    <StatusPill estado={a.estado} />
                  </div>
                  {[
                    ["Latencia real", a.latencia > 0 ? `${a.latencia}ms` : "—", a.latencia > 1000],
                    ["P95 estimado", a.p95 > 0 ? `${a.p95}ms` : "—", a.p95 > 2000],
                    ["Req. hoy", a.requestsHoy.toLocaleString(), false],
                    ["Tasa error", `${a.tasaError}%`, a.tasaError > 0],
                    ["Última verificación", a.lastCheck, false],
                  ].map(([k, v, warn]) => (
                    <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #2a3347" }}>
                      <span style={{ fontSize: 11, color: "#546280" }}>{k}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: warn ? "#ef4444" : "#e2e8f0" }}>{String(v)}</span>
                    </div>
                  ))}
                  {/* ✅ Barra de uptime determinista basada en tasa de error real */}
                  <UptimeBar tasaError={a.tasaError} />
                </div>
              ))}
              {APIS.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#546280" }}>Sin integraciones registradas en la base de datos</div>
              )}
            </div>
          )}

          {/* ══ LOGS ═════════════════════════════════════════════════════════ */}
          {activeTab === "logs" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
                {(["ALL", "ERROR", "WARN", "INFO", "OK"] as LogLevel[]).map((f) => {
                  const active = logFilter === f;
                  const color = f === "ERROR" ? "#ef4444" : f === "WARN" ? "#f59e0b" : f === "OK" ? "#22c55e" : f === "INFO" ? "#60a5fa" : "#8fa0bc";
                  return (
                    <button key={f} onClick={() => setLogFilter(f)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${active ? color : "#2a3347"}`, background: active ? `${color}18` : "transparent", color: active ? color : "#8fa0bc", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
                      {f}
                    </button>
                  );
                })}
                <input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="Buscar componente o mensaje..." style={{ flex: 1, minWidth: 160, background: "#161b27", border: "1px solid #2a3347", borderRadius: 5, padding: "4px 8px", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
                <span style={{ fontSize: 10, color: "#546280" }}>{filteredLogs.length} entradas</span>
              </div>
              <div style={{ background: "#161b27", border: "1px solid #2a3347", borderRadius: 8, overflow: "hidden", fontFamily: "monospace", fontSize: 11 }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#546280" }}>Sin resultados</div>
                ) : (
                  filteredLogs.map((l) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 12px", borderBottom: "1px solid #1e2535" }}>
                      <span style={{ color: "#546280", whiteSpace: "nowrap", flexShrink: 0, paddingTop: 1 }}>{l.ts}</span>
                      <LvlBadge lvl={l.lvl} />
                      <span style={{ color: "#a78bfa", flexShrink: 0, width: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingTop: 1 }}>{l.comp}</span>
                      <span style={{ color: "#8fa0bc", flex: 1 }}>{l.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══ AUDIT ════════════════════════════════════════════════════════ */}
          {activeTab === "audit" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={css.sectionTitle}>Registro de auditoría</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#22c55e" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
                  Tiempo real
                </span>
              </div>
              <div style={{ background: "#161b27", border: "1px solid #2a3347", borderRadius: 8, overflow: "hidden" }}>
                {AUDIT.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#546280" }}>Sin registros de auditoría</div>
                ) : AUDIT.map((a) => {
                  const actionCfg = {
                    UPDATE: { bg: "rgba(59,130,246,.12)", color: "#60a5fa", border: "rgba(59,130,246,.25)" },
                    DELETE: { bg: "rgba(239,68,68,.12)", color: "#ef4444", border: "rgba(239,68,68,.25)" },
                    CREATE: { bg: "rgba(34,197,94,.12)", color: "#22c55e", border: "rgba(34,197,94,.25)" },
                    LOGIN: { bg: "rgba(167,139,250,.12)", color: "#a78bfa", border: "rgba(167,139,250,.25)" },
                    EXPORT: { bg: "rgba(245,158,11,.12)", color: "#f59e0b", border: "rgba(245,158,11,.25)" },
                  }[a.action] || { bg: "rgba(139,148,158,.12)", color: "#8fa0bc", border: "rgba(139,148,158,.25)" };
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #1e2535" }}>
                      <span style={{ background: actionCfg.bg, color: actionCfg.color, border: `1px solid ${actionCfg.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, fontFamily: "monospace", flexShrink: 0 }}>{a.action}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, flexShrink: 0, width: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.user}</span>
                      <span style={{ fontSize: 11, color: "#8fa0bc", flex: 1 }}>{a.resource}</span>
                      {a.ip && <span style={{ fontSize: 10, color: "#546280", fontFamily: "monospace", flexShrink: 0 }}>{a.ip}</span>}
                      <span style={{ fontSize: 10, color: "#546280", fontFamily: "monospace", flexShrink: 0 }}>{a.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ BACKUPS ═══════════════════════════════════════════════════════ */}
          {activeTab === "backups" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={css.sectionTitle}>Gestión de respaldos</div>
                {/* ✅ Botón crear backup funcional */}
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("developer_token");
                    if (!token) return;
                    try {
                      const res = await fetch("/api/developer/backups", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ tipo: "FULL" }),
                      });
                      if (res.ok) fetchData(true);
                    } catch (e) { console.error(e); }
                  }}
                  style={{ ...css.btn, background: "rgba(34,197,94,.1)", borderColor: "rgba(34,197,94,.25)", color: "#22c55e" }}
                >
                  + Crear respaldo
                </button>
              </div>
              <div style={{ background: "#161b27", border: "1px solid #2a3347", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#1e2535" }}>
                      {["ID", "Tipo", "Estado", "Tamaño", "Duración", "Fecha", ""].map((h, i) => (
                        <th key={i} style={{ padding: "7px 12px", textAlign: i > 2 ? "right" : "left", color: "#546280", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BACKUPS.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#546280" }}>Sin respaldos registrados</td></tr>
                    ) : BACKUPS.map((b) => {
                      const sc = b.estado === "COMPLETADO" ? "#22c55e" : b.estado === "ERROR" ? "#ef4444" : "#f59e0b";
                      return (
                        <tr key={b.id} style={{ borderTop: "1px solid #2a3347" }}>
                          <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#e2e8f0", fontSize: 10 }}>{b.id.slice(0, 8)}…</td>
                          <td style={{ padding: "7px 12px", color: "#8fa0bc" }}>{b.tipo}</td>
                          <td style={{ padding: "7px 12px" }}><span style={{ color: sc, fontSize: 10, fontWeight: 600, fontFamily: "monospace" }}>{b.estado}</span></td>
                          <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace" }}>{b.size}</td>
                          <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace" }}>{b.dur}</td>
                          <td style={{ padding: "7px 12px", textAlign: "right", color: "#546280" }}>{b.fecha}</td>
                          <td style={{ padding: "7px 12px", textAlign: "right" }}>
                            {/* ✅ ARREGLO: botón descargar funcional usando ubicacion real */}
                            {b.estado === "COMPLETADO" && b.ubicacion && (
                              <a href={b.ubicacion} download style={{ ...css.btn, fontSize: 10, textDecoration: "none" }}>↓ Descargar</a>
                            )}
                            {b.estado === "COMPLETADO" && !b.ubicacion && (
                              <span style={{ fontSize: 10, color: "#344060" }}>Sin archivo</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* ══ MI PERFIL ════════════════════════════════════════════════════ */}
          {activeTab === "perfil" && <DeveloperPerfilTab />}
        </div>
      </main>
    </div>
  );
}