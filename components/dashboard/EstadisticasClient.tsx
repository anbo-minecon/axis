// components/dashboard/EstadisticasClient.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, Trophy, Clock,
  ClipboardList, BarChart2, Star, AlertCircle, Loader2,
  CheckCircle2, XCircle, Zap,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Global {
  totalSimulacros: number;
  promedioPorc: number;
  puntajeEscalado: number;
  mejorPct: number;
  peorPct: number;
  tiempoTotal: number;
  tendencia: number;
}

interface MateriaStat {
  materia: string;
  cantidad: number;
  promedioPorc: number;
  puntajeEscalado: number;
  mejorPorc: number;
  tiempoPromedio: number;
}

interface PuntoProgresion {
  nombre: string;
  materia: string;
  pct: number;
  puntaje: number;
  total: number;
  tiempoUsado: number;
  completadoEn: string;
}

interface ResumenSimulacro {
  nombre: string;
  materia: string;
  pct: number;
  puntaje: number;
  total: number;
}

interface EstadisticasData {
  sinDatos: boolean;
  global: Global;
  materias: MateriaStat[];
  progresion: PuntoProgresion[];
  mejorSimulacro: ResumenSimulacro;
  peorSimulacro: ResumenSimulacro;
}

// ── Constantes ─────────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "#3b82f6",
  "Lectura Crítica":       "#a855f7",
  "Ciencias Naturales":    "#10b981",
  "Sociales y Ciudadanas": "#f59e0b",
  "Inglés":                "#06b6d4",
};

const MATERIA_BG: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const getMateriaColor = (m: string) => MATERIA_COLORS[m] ?? "#6b7280";
const getMateriaBg   = (m: string) => MATERIA_BG[m]     ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTiempo(segs: number) {
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Alto",  color: "text-green-400", bg: "bg-green-500", barColor: "bg-green-500" };
  if (pct >= 50) return { label: "Medio", color: "text-amber-400", bg: "bg-amber-500", barColor: "bg-amber-500" };
  return           { label: "Bajo",  color: "text-red-400",   bg: "bg-red-500",   barColor: "bg-red-500" };
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short",
  });
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-[var(--text-primary)]",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
      </div>
      <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

// ── Gráfica de barras simple SVG ───────────────────────────────────────────
function BarChart({ puntos }: { puntos: PuntoProgresion[] }) {
  if (puntos.length === 0) return null;

  const W = 600;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 28;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const barW   = Math.max(8, Math.min(32, (chartW / puntos.length) * 0.6));
  const gap    = chartW / puntos.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[320px]"
        style={{ height: H }}
      >
        {/* Líneas guía */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = PAD_T + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line
                x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              />
              <text
                x={PAD_L - 4} y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255,255,255,0.3)"
              >
                {v}%
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {puntos.map((p, i) => {
          const x    = PAD_L + i * gap + gap / 2 - barW / 2;
          const barH = (p.pct / 100) * chartH;
          const y    = PAD_T + chartH - barH;
          const col  = getMateriaColor(p.materia);

          return (
            <g key={i}>
              {/* Barra fondo */}
              <rect
                x={x} y={PAD_T}
                width={barW} height={chartH}
                rx="4"
                fill="rgba(255,255,255,0.04)"
              />
              {/* Barra valor */}
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx="4"
                fill={col}
                opacity="0.85"
              />
              {/* Etiqueta % arriba */}
              {barH > 16 && (
                <text
                  x={x + barW / 2} y={y - 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(255,255,255,0.6)"
                >
                  {p.pct}%
                </text>
              )}
              {/* Label fecha abajo */}
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="8"
                fill="rgba(255,255,255,0.3)"
              >
                {fmtFecha(p.completadoEn)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function EstadisticasClient() {
  const [data, setData]       = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/dashboard/estadisticas")
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setData(data);
      })
      .catch((err) => {
        console.error("[EstadisticasClient] Error:", err);
        setError(err.message || "No se pudieron cargar las estadísticas.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  // ── Sin datos aún ──────────────────────────────────────────────────────
  if (data?.sinDatos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
          <BarChart2 className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Sin estadísticas aún</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Completa al menos un simulacro para ver tu progreso y estadísticas detalladas.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { global: g, materias, progresion, mejorSimulacro, peorSimulacro } = data;
  const nivelGlobal = getNivel(g.promedioPorc);

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-6">

      {/* ── Métricas globales ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Simulacros"
          value={String(g.totalSimulacros)}
          sub="completados"
        />
        <StatCard
          icon={Star}
          label="Promedio"
          value={`${g.promedioPorc}%`}
          sub={`${g.puntajeEscalado} / 500 pts`}
          color={nivelGlobal.color}
        />
        <StatCard
          icon={Trophy}
          label="Mejor resultado"
          value={`${g.mejorPct}%`}
          sub={`${Math.round((g.mejorPct / 100) * 500)} pts`}
          color="text-green-400"
        />
        <StatCard
          icon={Clock}
          label="Tiempo total"
          value={fmtTiempo(g.tiempoTotal)}
          sub="en simulacros"
        />
      </div>

      {/* ── Nivel global + tendencia ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Nivel general</p>
            <p className={cn("text-3xl font-extrabold", nivelGlobal.color)}>
              Nivel {nivelGlobal.label}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Puntaje promedio: <span className="font-bold text-[var(--text-primary)]">{g.puntajeEscalado}</span> / 500
            </p>
          </div>

          {/* Tendencia */}
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3",
            g.tendencia > 0
              ? "border-green-500/30 bg-green-500/10"
              : g.tendencia < 0
              ? "border-red-500/30 bg-red-500/10"
              : "border-white/10 bg-white/5"
          )}>
            {g.tendencia > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-400" />
            ) : g.tendencia < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-400" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className={cn("text-sm font-bold",
                g.tendencia > 0 ? "text-green-400" : g.tendencia < 0 ? "text-red-400" : "text-gray-400"
              )}>
                {g.tendencia > 0 ? "+" : ""}{g.tendencia}%
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Tendencia</p>
            </div>
          </div>
        </div>

        {/* Barra de nivel */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1.5">
            <span>0</span><span>250</span><span>500</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className={cn("h-full rounded-full transition-all duration-700", nivelGlobal.barColor)}
              style={{ width: `${(g.puntajeEscalado / 500) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span className="text-red-400">Nivel Bajo</span>
            <span className="text-amber-400">Nivel Medio</span>
            <span className="text-green-400">Nivel Alto</span>
          </div>
        </div>
      </div>

      {/* ── Progresión cronológica ── */}
      {progresion.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Progresión</h2>
            <span className="text-xs text-[var(--text-muted)]">— {progresion.length} simulacros</span>
          </div>
          <BarChart puntos={progresion} />

          {/* Leyenda de materias usadas */}
          <div className="flex flex-wrap gap-2">
            {[...new Set(progresion.map((p) => p.materia))].map((m) => (
              <span
                key={m}
                className="flex items-center gap-1.5 text-[10px] font-semibold"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: getMateriaColor(m) }}
                />
                <span className="text-[var(--text-muted)]">{m}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Por materia ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Rendimiento por materia</h2>
        </div>

        <div className="space-y-3">
          {materias.map((m) => {
            const nivel = getNivel(m.promedioPorc);
            return (
              <div key={m.materia} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: getMateriaColor(m.materia) }}
                    />
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {m.materia}
                    </span>
                    <span className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      getMateriaBg(m.materia)
                    )}>
                      {m.cantidad} {m.cantidad === 1 ? "simul." : "simul."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right shrink-0">
                    <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                      Mejor: {m.mejorPorc}%
                    </span>
                    <span className={cn("text-sm font-extrabold", nivel.color)}>
                      {m.promedioPorc}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${m.promedioPorc}%`,
                      background: getMateriaColor(m.materia),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mejor y peor simulacro ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mejor */}
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Mejor simulacro</p>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{mejorSimulacro.nombre}</p>
          <span className={cn(
            "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            getMateriaBg(mejorSimulacro.materia)
          )}>
            {mejorSimulacro.materia}
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-extrabold text-green-400">{mejorSimulacro.pct}%</span>
            <span className="text-xs text-[var(--text-muted)]">
              {mejorSimulacro.puntaje}/{mejorSimulacro.total} correctas
            </span>
          </div>
        </div>

        {/* Peor */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Para mejorar</p>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{peorSimulacro.nombre}</p>
          <span className={cn(
            "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            getMateriaBg(peorSimulacro.materia)
          )}>
            {peorSimulacro.materia}
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-extrabold text-red-400">{peorSimulacro.pct}%</span>
            <span className="text-xs text-[var(--text-muted)]">
              {peorSimulacro.puntaje}/{peorSimulacro.total} correctas
            </span>
          </div>
        </div>
      </div>

      {/* ── Historial detallado ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-5 space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Historial de simulacros</h2>
        <div className="space-y-2">
          {[...progresion].reverse().map((p, i) => {
            const nivel = getNivel(p.pct);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8">
                  <ClipboardList className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.nombre}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {p.materia} · {fmtFecha(p.completadoEn)} · {fmtTiempo(p.tiempoUsado)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-sm font-extrabold", nivel.color)}>{p.pct}%</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{p.puntaje}/{p.total}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}