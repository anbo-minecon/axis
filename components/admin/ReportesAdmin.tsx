// components/admin/ReportesAdmin.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3, Users, ClipboardList, TrendingUp, TrendingDown,
  Minus, Loader2, AlertCircle, RefreshCw, Trophy, CheckCheck,
  Clock, Hash, Layers, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface SimulacroMetrica {
  id: string;
  nombre: string;
  materia: string;
  estado: string;
  triCalculado: boolean;
  tieneSesiones: boolean;
  totalClaves: number;
  participantes: number;
  promedioPorc: number | null;
  puntajeEscalado: number | null;
  mejorPorc: number | null;
  peorPorc: number | null;
  oficiales: number;
  createdAt: string;
  fechaCierre: string | null;
}

interface DatosReportes {
  sistema: {
    totalEstudiantes: number;
    totalSimulacros: number;
    totalResultados: number;
    resultadosOficiales: number;
    estadoSimulacros: { borrador: number; publicado: number; cerrado: number; archivado: number };
  };
  simulacros: SimulacroMetrica[];
  distribucion: { label: string; cantidad: number }[];
  actividad: { fecha: string; cantidad: number }[];
  topEstudiantes: { id: string; nombre: string; colegio: string | null; simulacros: number; promedioPorc: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const ESTADO_COLORS: Record<string, string> = {
  BORRADOR:  "bg-gray-500/20 text-gray-400 border-gray-500/30",
  PUBLICADO: "bg-green-500/20 text-green-400 border-green-500/30",
  CERRADO:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ARCHIVADO: "bg-red-500/20 text-red-400 border-red-500/30",
};
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
const getMC = (m: string) => MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

function getNivel(pct: number | null) {
  if (pct == null) return { color: "text-gray-500", icon: Minus };
  if (pct >= 80)   return { color: "text-green-400", icon: TrendingUp   };
  if (pct >= 60)   return { color: "text-amber-400", icon: Minus        };
  return             { color: "text-red-400",   icon: TrendingDown };
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Histograma de distribución ─────────────────────────────────────────────
function Histograma({ datos }: { datos: { label: string; cantidad: number }[] }) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {datos.map(({ label, cantidad }) => {
        const h = Math.max((cantidad / max) * 100, cantidad > 0 ? 4 : 0);
        const color = label === "0–20" ? "#ef4444"
          : label === "21–40" ? "#f97316"
          : label === "41–60" ? "#f59e0b"
          : label === "61–80" ? "#22c55e"
          : "#10b981";
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[9px] text-gray-500 font-bold">{cantidad}</span>
            <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, backgroundColor: color, opacity: 0.8 }} />
            <span className="text-[9px] text-gray-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Gráfica de actividad ──────────────────────────────────────────────────
function GraficaActividad({ datos }: { datos: { fecha: string; cantidad: number }[] }) {
  if (!datos.length) return <p className="text-xs text-gray-600 text-center py-8">Sin actividad reciente.</p>;
  const max = Math.max(...datos.map((d) => d.cantidad), 1);
  const W = 500; const H = 80; const PAD = 20;
  const usableW = W - PAD * 2;
  const usableH = H - PAD;

  const xs = datos.map((_, i) => PAD + (i / Math.max(datos.length - 1, 1)) * usableW);
  const ys = datos.map((d) => PAD + (1 - d.cantidad / max) * usableH);

  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaD = `${pathD} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#actGrad)" />
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {datos.map((d, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="#6366f1" stroke="#0d1526" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ── Tarjeta métrica ────────────────────────────────────────────────────────
function MetricaCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string;
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

// ── Fila de simulacro en la tabla ─────────────────────────────────────────
function FilaSimulacro({ s }: { s: SimulacroMetrica }) {
  const nivel = getNivel(s.promedioPorc);
  const NivelIcon = nivel.icon;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white truncate max-w-[200px]">{s.nombre}</p>
          <span className={cn("text-[10px] rounded-full border px-1.5 py-0.5 font-semibold", getMC(s.materia))}>
            {s.materia}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
          ESTADO_COLORS[s.estado] ?? "bg-gray-500/20 text-gray-400")}>
          <Circle className="h-1.5 w-1.5 fill-current" />
          {s.estado}
        </span>
        {s.triCalculado && (
          <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
            <CheckCheck className="h-2 w-2" />TRI
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="flex items-center justify-center gap-1 text-sm text-gray-300">
          <Users className="h-3.5 w-3.5 text-gray-600" />
          {s.participantes}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {s.promedioPorc != null ? (
          <div>
            <p className={cn("text-sm font-extrabold", nivel.color)}>
              {s.puntajeEscalado}/500
            </p>
            <p className={cn("text-[10px] flex items-center justify-end gap-0.5", nivel.color)}>
              <NivelIcon className="h-2.5 w-2.5" />{s.promedioPorc}%
            </p>
          </div>
        ) : (
          <span className="text-xs text-gray-600">Sin datos</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-0.5 text-[10px] text-gray-500">
          {s.mejorPorc != null && <span className="text-green-400">↑ {s.mejorPorc}%</span>}
          {s.peorPorc  != null && <span className="text-red-400">↓ {s.peorPorc}%</span>}
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function ReportesAdmin() {
  const [datos,   setDatos]   = useState<DatosReportes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/admin/reportes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDatos(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
      <AlertCircle className="h-4 w-4 shrink-0" />{error}
    </div>
  );

  if (!datos) return null;
  const { sistema, simulacros, distribucion, actividad, topEstudiantes } = datos;

  const simulacrosFiltrados = filtroEstado === "TODOS"
    ? simulacros
    : simulacros.filter((s) => s.estado === filtroEstado);

  const pctOficiales = sistema.totalResultados > 0
    ? Math.round((sistema.resultadosOficiales / sistema.totalResultados) * 100)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">Reportes del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">Métricas globales y análisis por simulacro</p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Actualizar
        </button>
      </div>

      {/* ── Métricas globales ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaCard label="Estudiantes"     value={sistema.totalEstudiantes}  color="text-blue-400"    icon={Users}        />
        <MetricaCard label="Simulacros"      value={sistema.totalSimulacros}   color="text-violet-400"  icon={ClipboardList} />
        <MetricaCard label="Evaluaciones"    value={sistema.totalResultados}   color="text-white"       icon={Hash}         />
        <MetricaCard
          label="TRI oficiales"
          value={`${sistema.resultadosOficiales}`}
          sub={`${pctOficiales}% del total`}
          color="text-emerald-400"
          icon={CheckCheck}
        />
      </div>

      {/* ── Estado de simulacros ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />Simulacros por estado
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Borrador",  val: sistema.estadoSimulacros.borrador,  color: "text-gray-400"  },
            { label: "Publicado", val: sistema.estadoSimulacros.publicado, color: "text-green-400" },
            { label: "Cerrado",   val: sistema.estadoSimulacros.cerrado,   color: "text-amber-400" },
            { label: "Archivado", val: sistema.estadoSimulacros.archivado, color: "text-red-400"   },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-center">
              <p className={cn("text-2xl font-extrabold", color)}>{val}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fila: distribución + actividad ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Distribución puntajes */}
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />Distribución de puntajes
          </h2>
          {sistema.totalResultados > 0
            ? <Histograma datos={distribucion} />
            : <p className="text-xs text-gray-600 text-center py-8">Sin datos aún.</p>}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />Actividad (últimos 30 días)
          </h2>
          <GraficaActividad datos={actividad} />
          <p className="text-[10px] text-gray-600 text-right">
            Total: {actividad.reduce((a, d) => a + d.cantidad, 0)} evaluaciones
          </p>
        </div>
      </div>

      {/* ── Top estudiantes ── */}
      {topEstudiantes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />Top 5 estudiantes
          </h2>
          <div className="space-y-2">
            {topEstudiantes.map((e, i) => {
              const nivel = getNivel(e.promedioPorc);
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                    i === 0 ? "bg-amber-500/20 text-amber-400"
                    : i === 1 ? "bg-gray-400/20 text-gray-300"
                    : i === 2 ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/5 text-gray-600",
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{e.nombre}</p>
                    <p className="text-[10px] text-gray-500">
                      {e.colegio ?? "Sin colegio"} · {e.simulacros} simulacros
                    </p>
                  </div>
                  <p className={cn("text-sm font-extrabold shrink-0", nivel.color)}>
                    {Math.round((e.promedioPorc / 100) * 500)}/500
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabla simulacros ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        {/* Filtros */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 flex-wrap">
          <h2 className="text-sm font-bold text-white mr-2">Detalle por simulacro</h2>
          {["TODOS", "PUBLICADO", "CERRADO", "BORRADOR", "ARCHIVADO"].map((est) => (
            <button key={est} onClick={() => setFiltroEstado(est)}
              className={cn("rounded-xl px-2.5 py-1 text-[10px] font-semibold transition border",
                filtroEstado === est
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-white/10 text-gray-500 hover:text-white hover:border-white/20")}>
              {est === "TODOS" ? "Todos" : est.charAt(0) + est.slice(1).toLowerCase()}
              <span className="ml-1 opacity-60">
                ({est === "TODOS" ? simulacros.length : simulacros.filter((s) => s.estado === est).length})
              </span>
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-600">
            {simulacrosFiltrados.length} resultado{simulacrosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Simulacro", "Estado", "Participantes", "Promedio", "Rango"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {simulacrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-600">
                    No hay simulacros en esta categoría.
                  </td>
                </tr>
              ) : (
                simulacrosFiltrados.map((s) => <FilaSimulacro key={s.id} s={s} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}