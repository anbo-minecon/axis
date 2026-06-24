// components/dashboard/EstadisticasClient.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Clock,
  Trophy, Target, BookOpen, Loader2, AlertCircle,
  CheckCircle2, Info, Hash,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface MateriaStat {
  materia: string;
  cantidad: number;
  promedioPorc: number;
  puntajeEscalado: number;
  mejorPorc: number;
  peorPorc: number;
  tiempoPromedio: number;
  oficiales: number;
}

interface PuntoProgresion {
  nombre: string;
  materia: string;
  pct: number;
  puntajeTRI: number | null;
  estadoCalif: string;
  tiempoUsado: number;
  completadoEn: string;
}

interface AreaStat {
  area: string;
  cantidad: number;
  promedio: number;
  mejor: number;
  peor: number;
  oficiales: number;
}

interface DatosEstadisticas {
  sinDatos: boolean;
  global?: {
    totalSimulacros: number;
    oficiales: number;
    promedioPorc: number;
    puntajeEscalado: number;
    mejorPct: number;
    peorPct: number;
    tiempoTotal: number;
    tendencia: number;
  };
  materias?: MateriaStat[];
  areas?: AreaStat[];
  progresion?: PuntoProgresion[];
  mejorSimulacro?: { nombre: string; materia: string; pct: number; estadoCalif: string };
  peorSimulacro?:  { nombre: string; materia: string; pct: number; estadoCalif: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  "Matemáticas":           { bg: "bg-blue-500/15",    border: "border-blue-500/30",    text: "text-blue-400",    bar: "#3b82f6" },
  "Lectura Crítica":       { bg: "bg-purple-500/15",  border: "border-purple-500/30",  text: "text-purple-400",  bar: "#a855f7" },
  "Ciencias Naturales":    { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", bar: "#10b981" },
  "Sociales y Ciudadanas": { bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-400",   bar: "#f59e0b" },
  "Inglés":                { bg: "bg-cyan-500/15",    border: "border-cyan-500/30",    text: "text-cyan-400",    bar: "#06b6d4" },
  "Multi-materia":         { bg: "bg-violet-500/15",  border: "border-violet-500/30",  text: "text-violet-400",  bar: "#8b5cf6" },
};
const defaultColor = { bg: "bg-gray-500/15", border: "border-gray-500/30", text: "text-gray-400", bar: "#6b7280" };
const getMC = (m: string) => MATERIA_COLORS[m] ?? defaultColor;

function fmtTiempo(segs: number) {
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}
function getNivel(pct: number) {
  if (pct >= 80) return { label: "Alto",  color: "text-green-400",  bg: "bg-green-500",  icon: TrendingUp   };
  if (pct >= 60) return { label: "Medio", color: "text-amber-400",  bg: "bg-amber-500",  icon: Minus        };
  return           { label: "Bajo",  color: "text-red-400",    bg: "bg-red-500",    icon: TrendingDown };
}

// ── Gráfica de línea SVG ───────────────────────────────────────────────────
function GraficaProgresion({ puntos }: { puntos: PuntoProgresion[] }) {
  if (puntos.length < 2) return null;

  const W = 600; const H = 180; const PAD = 32;
  const usableW = W - PAD * 2;
  const usableH = H - PAD * 2;

  const xs = puntos.map((_, i) => PAD + (i / (puntos.length - 1)) * usableW);
  const ys = puntos.map((p) => PAD + (1 - p.pct / 100) * usableH);

  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaD = `${pathD} L ${xs[xs.length - 1]} ${H - PAD} L ${xs[0]} ${H - PAD} Z`;

  // Líneas horizontales de referencia
  const refs = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
        {/* Grid */}
        {refs.map((v) => {
          const y = PAD + (1 - v / 100) * usableH;
          return (
            <g key={v}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={PAD - 6} y={y + 4} textAnchor="end"
                fill="rgba(255,255,255,0.3)" fontSize="10">{v}</text>
            </g>
          );
        })}

        {/* Área */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Línea */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos */}
        {puntos.map((p, i) => {
          const esOficial = p.estadoCalif === "OFICIAL";
          return (
            <g key={i}>
              <circle cx={xs[i]} cy={ys[i]} r="5"
                fill={esOficial ? "#10b981" : "#6366f1"}
                stroke="#0d1526" strokeWidth="2" />
              {/* Tooltip label arriba */}
              <text x={xs[i]} y={ys[i] - 10} textAnchor="middle"
                fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="700">
                {p.pct}%
              </text>
            </g>
          );
        })}

        {/* Eje X: fechas */}
        {puntos.map((p, i) => (
          <text key={i} x={xs[i]} y={H - 4} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" fontSize="9">
            {fmtFecha(p.completadoEn)}
          </text>
        ))}
      </svg>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-2 px-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />Puntaje TRI oficial
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />Preliminar
        </div>
      </div>
    </div>
  );
}

// ── Gráfica de barras SVG por materia ─────────────────────────────────────
function GraficaMaterias({ materias }: { materias: MateriaStat[] }) {
  if (!materias.length) return null;
  const max = Math.max(...materias.map((m) => m.promedioPorc), 10);
  const W = 500; const H = 160; const PAD_L = 130; const PAD_R = 60; const PAD_V = 16;
  const rowH = (H - PAD_V * 2) / materias.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
      {/* Líneas verticales */}
      {[0, 25, 50, 75, 100].map((v) => {
        const x = PAD_L + (v / max) * (W - PAD_L - PAD_R);
        return (
          <line key={v} x1={x} y1={PAD_V} x2={x} y2={H - PAD_V}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        );
      })}

      {materias.map((m, i) => {
        const y       = PAD_V + i * rowH + rowH * 0.2;
        const barH    = rowH * 0.6;
        const barW    = ((m.promedioPorc / max) * (W - PAD_L - PAD_R));
        const color   = getMC(m.materia).bar;
        const nivel   = getNivel(m.promedioPorc);

        return (
          <g key={m.materia}>
            {/* Nombre */}
            <text x={PAD_L - 8} y={y + barH / 2 + 4} textAnchor="end"
              fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="600">
              {m.materia.length > 14 ? m.materia.slice(0, 13) + "…" : m.materia}
            </text>
            {/* Barra fondo */}
            <rect x={PAD_L} y={y} width={W - PAD_L - PAD_R} height={barH}
              fill="rgba(255,255,255,0.04)" rx="4" />
            {/* Barra valor */}
            <rect x={PAD_L} y={y} width={Math.max(barW, 4)} height={barH}
              fill={color} fillOpacity="0.8" rx="4" />
            {/* Valor */}
            <text x={PAD_L + barW + 6} y={y + barH / 2 + 4}
              fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="700">
              {m.promedioPorc}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Tarjeta de métrica ─────────────────────────────────────────────────────
function MetricaCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string;
  color?: string; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4 shrink-0", color ?? "text-gray-500")} />}
      </div>
      <p className={cn("text-2xl font-extrabold", color ?? "text-white")}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function EstadisticasClient() {
  const [datos,   setDatos]   = useState<DatosEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/dashboard/estadisticas")
      .then((r) => r.json())
      .then(setDatos)
      .catch(() => setError("No se pudieron cargar las estadísticas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 m-4">
      <AlertCircle className="h-4 w-4 shrink-0" />{error}
    </div>
  );

  if (!datos || datos.sinDatos) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
        <BarChart3 className="h-8 w-8 text-indigo-400" />
      </div>
      <div>
        <p className="text-base font-bold text-white">Sin estadísticas aún</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Completa al menos un simulacro para ver tu progreso aquí.
        </p>
      </div>
    </div>
  );

  const { global: g, materias = [], progresion = [], mejorSimulacro, peorSimulacro } = datos;
  if (!g) return null;

  const tendenciaIcon  = g.tendencia > 0 ? TrendingUp : g.tendencia < 0 ? TrendingDown : Minus;
  const tendenciaColor = g.tendencia > 0 ? "text-green-400" : g.tendencia < 0 ? "text-red-400" : "text-gray-400";
  const nivelGlobal    = getNivel(g.promedioPorc);
  const NivelIcon      = nivelGlobal.icon;

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-6">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-xl font-extrabold text-white">Mis Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Basado en {g.totalSimulacros} simulacro{g.totalSimulacros !== 1 ? "s" : ""}
          {g.oficiales > 0 && ` · ${g.oficiales} con puntaje TRI oficial`}
        </p>
      </div>

      {/* ── Métricas globales ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaCard
          label="Puntaje promedio"
          value={`${g.puntajeEscalado}/500`}
          sub={`${g.promedioPorc}% de aciertos`}
          color={nivelGlobal.color}
          icon={NivelIcon}
        />
        <MetricaCard
          label="Tendencia"
          value={g.tendencia > 0 ? `+${g.tendencia}%` : `${g.tendencia}%`}
          sub={g.tendencia > 0 ? "Mejorando" : g.tendencia < 0 ? "Bajando" : "Estable"}
          color={tendenciaColor}
          icon={tendenciaIcon}
        />
        <MetricaCard
          label="Mejor simulacro"
          value={`${Math.round((g.mejorPct / 100) * 500)}/500`}
          sub={`${g.mejorPct}%`}
          color="text-green-400"
          icon={Trophy}
        />
        <MetricaCard
          label="Tiempo total"
          value={fmtTiempo(g.tiempoTotal)}
          sub="en simulacros"
          color="text-blue-400"
          icon={Clock}
        />
      </div>

      {/* ── Puntaje global grande ── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-violet-600/10 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Puntaje global ICFES estimado</p>
            <p className={cn("text-5xl font-extrabold", nivelGlobal.color)}>
              {g.puntajeEscalado}
              <span className="text-2xl text-gray-600 font-semibold"> /500</span>
            </p>
            <div className={cn("flex items-center gap-1.5 mt-2 text-sm font-semibold", nivelGlobal.color)}>
              <NivelIcon className="h-4 w-4" />{nivelGlobal.label}
              {g.oficiales > 0 && (
                <span className="ml-2 text-[10px] rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-bold">
                  {g.oficiales} TRI oficial{g.oficiales !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Gauge visual */}
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={g.promedioPorc >= 80 ? "#22c55e" : g.promedioPorc >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={`${g.promedioPorc * 2.51} 251`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-extrabold text-white">{g.promedioPorc}%</span>
            </div>
          </div>
        </div>

        {/* Barra progreso */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className={cn("h-full rounded-full transition-all", nivelGlobal.bg)}
            style={{ width: `${g.promedioPorc}%` }} />
        </div>
      </div>

      {/* ── Progresión cronológica ── */}
      {progresion.length >= 2 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />Progresión
          </h2>
          <GraficaProgresion puntos={progresion} />
        </div>
      )}

      {/* ── Por materia ── */}
      {materias.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />Por materia
          </h2>

          <GraficaMaterias materias={materias} />

          <div className="space-y-2 mt-2">
            {materias.map((m) => {
              const mc    = getMC(m.materia);
              const nivel = getNivel(m.promedioPorc);
              return (
                <div key={m.materia}
                  className={cn("rounded-xl border px-4 py-3 flex items-center gap-4", mc.bg, mc.border)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cn("text-sm font-bold truncate", mc.text)}>{m.materia}</p>
                      {m.oficiales > 0 && (
                        <span className="text-[9px] rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-emerald-400 font-bold shrink-0">
                          {m.oficiales} TRI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span>{m.cantidad} simulacro{m.cantidad !== 1 ? "s" : ""}</span>
                      <span>Mejor: {m.mejorPorc}%</span>
                      <span>~{fmtTiempo(m.tiempoPromedio)}/sim.</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-xl font-extrabold", nivel.color)}>{m.promedioPorc}%</p>
                    <p className="text-[10px] text-gray-600">{m.puntajeEscalado}/500</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Por área ICFES ── */}
      {datos.areas && datos.areas.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-400" />Por área ICFES
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {datos.areas.map((a) => {
              const nivel = getNivel(a.promedio);
              return (
                <div key={a.area} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-white">{a.area}</p>
                    {a.oficiales > 0 && (
                      <span className="text-[9px] rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-bold">
                        {a.oficiales} oficiales
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl font-extrabold", nivel.color)}>{a.promedio}%</span>
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={cn("h-full rounded-full", nivel.bg)}
                      style={{ width: `${Math.min(100, Math.max(0, a.promedio))}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Mejor {a.mejor}%</span>
                    <span>Peor {a.peor}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mejor y peor ── */}
      {mejorSimulacro && peorSimulacro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-400" />
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Mejor resultado</p>
            </div>
            <p className="text-sm font-bold text-white truncate">{mejorSimulacro.nombre}</p>
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] rounded-full border px-2 py-0.5 font-semibold",
                getMC(mejorSimulacro.materia).text, getMC(mejorSimulacro.materia).border)}>
                {mejorSimulacro.materia}
              </span>
              <p className="text-2xl font-extrabold text-green-400">{mejorSimulacro.pct}%</p>
            </div>
            {mejorSimulacro.estadoCalif === "OFICIAL" && (
              <p className="text-[10px] text-emerald-500">✓ Puntaje TRI oficial</p>
            )}
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-red-400" />
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Para mejorar</p>
            </div>
            <p className="text-sm font-bold text-white truncate">{peorSimulacro.nombre}</p>
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] rounded-full border px-2 py-0.5 font-semibold",
                getMC(peorSimulacro.materia).text, getMC(peorSimulacro.materia).border)}>
                {peorSimulacro.materia}
              </span>
              <p className="text-2xl font-extrabold text-red-400">{peorSimulacro.pct}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Aviso TRI ── */}
      {g.oficiales < g.totalSimulacros && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Puntajes preliminares</p>
            <p className="text-xs text-amber-400 mt-0.5">
              {g.totalSimulacros - g.oficiales} simulacro{g.totalSimulacros - g.oficiales !== 1 ? "s" : ""} aún
              muestran puntaje preliminar. El puntaje TRI oficial se calcula automáticamente cuando el
              simulacro cierra, considerando la dificultad de cada pregunta según el desempeño del grupo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}