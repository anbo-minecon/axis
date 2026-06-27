// components/dashboard/ResultadoDetalleClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Minus, Clock, Hash, Trophy,
  TrendingUp, TrendingDown, ArrowLeft, Loader2, AlertCircle,
  BarChart3, Filter, Layers, Info, CheckCheck,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface PreguntaDetalle {
  numero: number;
  sesionId?: string;
  sesionNumero?: number;
  sesionNombre?: string;
  respuestaCorrecta: string;
  respuestaDada: string | null;
  correcto: boolean;
  sinResponder: boolean;
}

interface ResumenSesion {
  sesionId: string;
  numero: number;
  nombre: string;
  aciertos: number;
  total: number;
  puntajePreliminar: number;
  puntajeTRI: number | null;
  pct: number;
  tiempoUsado: number;
  completadoEn: string;
}

interface DatosDetalle {
  examen: {
    id: string;
    nombre: string;
    materia: string;
    tiempoMin: number;
    tieneSesiones: boolean;
  };
  resumen: {
    puntaje: number;
    total: number;
    pct: number;
    puntajeEscalado: number;
    puntajePreliminar: number;
    puntajeTRI: number | null;
    estadoCalif: string;
    tiempoUsado: number;
    completadoEn: string;
    totalCorrectas: number;
    totalIncorrectas: number;
    sinResponder: number;
    puntajePorArea?: Record<string, number> | null;
    ranking?: number | null;
    percentil?: number | null;
  };
  preguntas: PreguntaDetalle[];
  sesiones: ResumenSesion[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
const getMC = (m: string) => MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400",  bg: "bg-green-500",  icon: TrendingUp   };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400",  bg: "bg-amber-500",  icon: Minus        };
  return           { label: "Nivel Bajo",  color: "text-red-400",    bg: "bg-red-500",    icon: TrendingDown };
}

function fmtTiempo(segs: number) {
  if (!segs) return "—";
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const AREA_LABELS: Record<string, string> = {
  "LECTURA CRITICA": "Lectura Crítica",
  "MATEMATICAS": "Matemáticas",
  "CIENCIAS NATURALES": "Ciencias Naturales",
  "SOCIALES Y CIUDADANAS": "Sociales y Ciudadanas",
  "INGLES": "Inglés",
};

function getAreaLabel(area: string) {
  return AREA_LABELS[area] ?? area;
}

// ── Mini gauge ─────────────────────────────────────────────────────────────
function Gauge({ pct, color }: { pct: number; color: string }) {
  const stroke = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={stroke} strokeWidth="12"
          strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-xs font-extrabold", color)}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Fila de pregunta ───────────────────────────────────────────────────────
function FilaPregunta({ p }: { p: PreguntaDetalle }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
      p.correcto
        ? "border-green-500/20 bg-green-500/5"
        : p.sinResponder
        ? "border-white/8 bg-white/[0.02]"
        : "border-red-500/20 bg-red-500/5",
    )}>
      {/* Ícono estado */}
      <div className="shrink-0">
        {p.correcto
          ? <CheckCircle2 className="h-4 w-4 text-green-400" />
          : p.sinResponder
          ? <Minus className="h-4 w-4 text-gray-600" />
          : <XCircle className="h-4 w-4 text-red-400" />}
      </div>

      {/* Número */}
      <span className="text-xs font-bold text-gray-500 w-12 shrink-0">
        Preg. {p.numero}
      </span>

      {/* Respuesta dada */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-[10px] text-gray-600">Tu resp.:</span>
        <span className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold",
          p.sinResponder
            ? "bg-white/5 text-gray-600"
            : p.correcto
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400",
        )}>
          {p.respuestaDada ?? "—"}
        </span>
      </div>

      {/* Respuesta correcta */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-gray-600">Correcta:</span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-xs font-extrabold">
          {p.respuestaCorrecta}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function ResultadoDetalleClient({ examenId }: { examenId: string }) {
  const router = useRouter();
  const [datos,   setDatos]   = useState<DatosDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filtro,  setFiltro]  = useState<"todas" | "correctas" | "incorrectas" | "sinResponder">("todas");
  const [sesionFiltro, setSesionFiltro] = useState<string>("todas");

  useEffect(() => {
    fetch(`/api/dashboard/resultados/${examenId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDatos(d);
      })
      .catch((e) => setError(e?.message ?? "Error al cargar el resultado."))
      .finally(() => setLoading(false));
  }, [examenId]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 m-6">
      <AlertCircle className="h-4 w-4 shrink-0" />{error}
    </div>
  );

  if (!datos) return null;

  const { examen, resumen, preguntas, sesiones } = datos;
  const nivel     = getNivel(resumen.pct);
  const NivelIcon = nivel.icon;
  const esOficial = resumen.estadoCalif === "OFICIAL";

  // Filtrar preguntas
  let preguntasFiltradas = preguntas;
  if (filtro === "correctas")    preguntasFiltradas = preguntasFiltradas.filter((p) => p.correcto);
  if (filtro === "incorrectas")  preguntasFiltradas = preguntasFiltradas.filter((p) => !p.correcto && !p.sinResponder);
  if (filtro === "sinResponder") preguntasFiltradas = preguntasFiltradas.filter((p) => p.sinResponder);
  if (sesionFiltro !== "todas")    preguntasFiltradas = preguntasFiltradas.filter((p) => p.sesionId === sesionFiltro);

  const filtros = [
    { id: "todas",        label: `Todas ${preguntas.length}` },
    { id: "correctas",    label: `Correctas ${resumen.totalCorrectas}` },
    { id: "incorrectas",  label: `Incorrectas ${resumen.totalIncorrectas}` },
    { id: "sinResponder", label: `Sin responder ${resumen.sinResponder}` },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-5">

      {/* Volver */}
      <button onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
        <ArrowLeft className="h-4 w-4" />Volver a resultados
      </button>

      {/* ── Card principal ── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-white">{examen.nombre}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", getMC(examen.materia))}>
                {examen.materia}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                esOficial
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30",
              )}>
                {esOficial
                  ? <><CheckCheck className="h-2.5 w-2.5" />Puntaje TRI oficial</>
                  : <><Info className="h-2.5 w-2.5" />Puntaje preliminar</>}
              </span>
              {examen.tieneSesiones && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400">
                  <Layers className="h-2.5 w-2.5" />{sesiones.length} sesiones
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{fmtFecha(resumen.completadoEn)}</p>
          </div>
          <Gauge pct={resumen.pct} color={nivel.color} />
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Puntaje */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[10px] text-gray-500 mb-1">
              {esOficial ? "Puntaje TRI" : "Puntaje prelim."}
            </p>
            <p className={cn("text-2xl font-extrabold", nivel.color)}>
              {resumen.puntajeEscalado}
              <span className="text-sm text-gray-600 font-normal">/500</span>
            </p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", nivel.bg)} style={{ width: `${resumen.pct}%` }} />
            </div>
          </div>

          {/* Aciertos */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[10px] text-gray-500 mb-1">Aciertos</p>
            <p className="text-2xl font-extrabold text-white">
              {resumen.totalCorrectas}
              <span className="text-sm text-gray-600 font-normal">/{resumen.total}</span>
            </p>
            <p className={cn("text-[10px] mt-1 flex items-center gap-1 font-semibold", nivel.color)}>
              <NivelIcon className="h-3 w-3" />{nivel.label}
            </p>
          </div>

          {/* Ranking */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[10px] text-gray-500 mb-1">Ranking</p>
            <p className="text-2xl font-extrabold text-white">
              {resumen.ranking != null ? `#${resumen.ranking}` : "—"}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">Posición en el grupo</p>
          </div>

          {/* Percentil */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[10px] text-gray-500 mb-1">Percentil</p>
            <p className="text-2xl font-extrabold text-white">
              {resumen.percentil != null ? `${resumen.percentil}%` : "—"}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">Mejor que el grupo</p>
          </div>
        </div>

        {/* Puntaje por área */}
        {resumen.puntajePorArea && Object.keys(resumen.puntajePorArea).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(resumen.puntajePorArea).map(([area, puntaje]) => (
              <div key={area} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-2">
                  {getAreaLabel(area)}
                </p>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl font-extrabold text-white">{Math.round((puntaje / 100) * 500)}</p>
                  <span className="text-xs text-gray-400">/500</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, puntaje))}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Resumen por sesión ── */}
      {examen.tieneSesiones && sesiones.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />Desglose por sesión
          </h2>
          <div className="space-y-2">
            {sesiones.map((s) => {
              const n = getNivel(s.pct);
              return (
                <div key={s.sesionId}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600/30 text-[10px] font-extrabold text-violet-300">
                    {s.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{s.nombre}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                      <span>{s.aciertos}/{s.total} correctas</span>
                      <span>{fmtTiempo(s.tiempoUsado)}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div className={cn("h-full rounded-full", n.bg)} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-base font-extrabold", n.color)}>{s.pct}%</p>
                    {s.puntajeTRI != null
                      ? <p className="text-[9px] text-emerald-400">TRI: {s.puntajeTRI}</p>
                      : <p className="text-[9px] text-gray-600">Prelim.: {s.puntajePreliminar}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Revisión pregunta por pregunta ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />Revisión pregunta por pregunta
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-gray-600 shrink-0" />
          {filtros.map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id as any)}
              className={cn("rounded-xl px-3 py-1.5 text-[11px] font-semibold transition border",
                filtro === f.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-white/10 text-gray-400 hover:text-white hover:border-white/20")}>
              {f.label}
            </button>
          ))}
          {sesiones.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Sesiones</span>
              <button
                onClick={() => setSesionFiltro("todas")}
                className={cn("rounded-xl px-3 py-1.5 text-[11px] font-semibold transition border",
                  sesionFiltro === "todas"
                    ? "bg-white text-slate-950 border-white"
                    : "border-white/10 text-gray-400 hover:text-white hover:border-white/20")}
              >Todas</button>
              {sesiones.map((s) => (
                <button
                  key={s.sesionId}
                  onClick={() => setSesionFiltro(s.sesionId)}
                  className={cn("rounded-xl px-3 py-1.5 text-[11px] font-semibold transition border",
                    sesionFiltro === s.sesionId
                      ? "bg-white text-slate-950 border-white"
                      : "border-white/10 text-gray-400 hover:text-white hover:border-white/20")}
                >S{s.numero}</button>
              ))}
            </div>
          )}
          <span className="ml-auto text-[10px] text-gray-600">
            {preguntasFiltradas.length} pregunta{preguntasFiltradas.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista */}
        {preguntasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">No hay preguntas en esta categoría.</p>
        ) : (
          <div className="space-y-2">
            {preguntasFiltradas.map((p) => (
              <FilaPregunta key={`${p.sesionId ?? "global"}-${p.numero}`} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Aviso TRI ── */}
      {!esOficial && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Puntaje preliminar</p>
            <p className="text-xs text-amber-400 mt-0.5">
              Este puntaje se recalculará automáticamente cuando el simulacro cierre, usando el
              modelo TRI que considera la dificultad real de cada pregunta según el desempeño de
              todo el grupo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}