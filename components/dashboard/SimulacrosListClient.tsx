// components/dashboard/SimulacrosListClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Clock, Hash, Play, CheckCircle2,
  Lock, Trophy, TrendingUp, TrendingDown, Minus,
  AlertCircle, Loader2, Layers, BookOpen, CheckCheck, Info,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface SesionResumen {
  id: string;
  numero: number;
  nombre: string;
  tiempoMin: number;
}

interface SimulacroCard {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  tieneSesiones: boolean;
  sesiones: SesionResumen[];
  estado: string;
  fechaDisponible: string | null;
  fechaCierre: string | null;
  bloqueado: boolean;
  completado: boolean;
  resultado: {
    puntaje:           number;   // aciertos crudos
    total:             number;
    puntajePreliminar: number;   // escala 0-100
    puntajeTRI:        number | null;
    estadoCalif:       string;
    puntajeEfectivo:   number;   // el que se muestra (TRI si oficial, prelim si no)
    tiempoUsado:       number;
    completadoEn:      string;
  } | null;
}

type Filtro = "todos" | "disponibles" | "completados";

// ── Helpers ────────────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

const MATERIA_IMAGEN_MAP: Record<string, string> = {
  "Matemáticas":           "/images/simulacro/matematicas.jpg",
  "Lectura Crítica":       "/images/simulacro/lectura-critica.jpg",
  "Ciencias Naturales":    "/images/simulacro/ciencias-naturales.jpg",
  "Sociales y Ciudadanas": "/images/simulacro/sociales-ciudadanas.jpg",
  "Inglés":                "/images/simulacro/ingles.jpg",
};
const getImagenSimulacro = (materia: string) =>
  MATERIA_IMAGEN_MAP[materia] ?? "/images/simulacro/default.jpg";

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400", barColor: "bg-green-500",  icon: TrendingUp   };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400", barColor: "bg-amber-500",  icon: Minus        };
  return           { label: "Nivel Bajo",  color: "text-red-400",   barColor: "bg-red-500",    icon: TrendingDown };
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTiempo(segs: number) {
  if (!segs) return "—";
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ── Card ───────────────────────────────────────────────────────────────────
function SimulacroCardItem({ s }: { s: SimulacroCard }) {
  // Mostrar puntaje efectivo como porcentaje para el nivel y como escala ICFES sobre 500 en la tarjeta
  const pct            = s.resultado?.puntajeEfectivo ?? 0;
  const puntajeEscalado = Math.round((pct / 100) * 500);
  const nivel          = s.resultado ? getNivel(pct) : null;
  const materiaLabel   = s.tieneSesiones ? "Multi-materia" : s.materia;
  const esOficial      = s.resultado?.estadoCalif === "OFICIAL";

  const Imagen = () => (
    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
      <img
        src={getImagenSimulacro(s.materia)}
        alt={s.materia}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="absolute bottom-2 left-2">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
          getMateriaColor(materiaLabel),
        )}>
          <BookOpen className="h-2.5 w-2.5" />{materiaLabel}
        </span>
      </div>
      {s.tieneSesiones && s.sesiones.length > 0 && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-600/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Layers className="h-2.5 w-2.5" />{s.sesiones.length} sesiones
          </span>
        </div>
      )}
    </div>
  );

  // ── BLOQUEADO ─────────────────────────────────────────────────────────
  if (s.bloqueado) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] overflow-hidden opacity-60 select-none group">
        <Imagen />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-[var(--text-primary)] text-sm">{s.nombre}</h3>
            <Lock className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.totalPreguntas} preguntas</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.tiempoMin} min</span>
          </div>
          {s.fechaDisponible && (
            <p className="text-xs text-gray-600">Disponible el: {fmtFecha(s.fechaDisponible)}</p>
          )}
          <div className="mt-3 w-full rounded-xl border border-white/5 bg-white/5 py-2.5 text-center text-xs font-semibold text-gray-600">
            Bloqueado
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETADO ───────────────────────────────────────────────────────
  if (s.completado && s.resultado) {
    const NivelIcon = nivel!.icon;
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-white/20 transition group">
        <Imagen />
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-[var(--text-primary)] text-sm flex-1 mr-2">{s.nombre}</h3>
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
          </div>

          {/* Barra de sesiones completadas */}
          {s.tieneSesiones && s.sesiones.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {s.sesiones.map((ses) => (
                <div key={ses.id} className="flex-1 h-1.5 rounded-full bg-green-500" />
              ))}
              <span className="text-[10px] text-green-400 font-semibold ml-1 shrink-0">
                {s.sesiones.length}/{s.sesiones.length} ✓
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />{s.totalPreguntas} preguntas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {s.resultado.tiempoUsado > 0 ? fmtTiempo(s.resultado.tiempoUsado) : `${s.tiempoMin} min`}
            </span>
          </div>

          {/* Puntaje — usa puntajeEfectivo (ya calculado en API) */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">
                {esOficial ? "Puntaje TRI oficial" : "Puntaje preliminar"}
              </p>
              {esOficial
                ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    <CheckCheck className="h-2.5 w-2.5" />TRI
                  </span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                    <Info className="h-2.5 w-2.5" />Prelim.
                  </span>
              }
            </div>
            <div className="flex items-end justify-between">
              {/* BUG FIX: mostrar puntajeEfectivo/100, NO puntaje/total */}
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                {puntajeEscalado}
                <span className="text-base font-semibold text-gray-500"> /500</span>
              </span>
              <span className={cn("flex items-center gap-1 text-xs font-bold", nivel!.color)}>
                <NivelIcon className="h-3.5 w-3.5" />{nivel!.label}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full transition-all", nivel!.barColor)}
                style={{ width: `${pct}%` }} />
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">Realizado el: {fmtFecha(s.resultado.completadoEn)}</p>

          <Link
            href={`/dashboard/resultados/${s.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            <Trophy className="h-3.5 w-3.5" />Ver resultados
          </Link>
        </div>
      </div>
    );
  }

  // ── DISPONIBLE ───────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition group">
      <Imagen />
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-[var(--text-primary)] text-sm flex-1 mr-2">{s.nombre}</h3>
          <Play className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        </div>

        {/* Preview sesiones */}
        {s.tieneSesiones && s.sesiones.length > 0 && (
          <div className="mb-3 space-y-1">
            {s.sesiones.map((ses) => (
              <div key={ses.id} className="flex items-center gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-violet-600/30 text-[8px] font-bold text-violet-300">
                  {ses.numero}
                </div>
                <span className="text-[10px] text-gray-500 truncate">{ses.nombre}</span>
                <span className="text-[10px] text-gray-600 ml-auto shrink-0">{ses.tiempoMin}m</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.totalPreguntas} preguntas</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.tiempoMin} min</span>
        </div>

        {s.fechaDisponible && (
          <p className="text-xs text-gray-500 mb-2">Disponible desde: {fmtFecha(s.fechaDisponible)}</p>
        )}
        {s.fechaCierre && (
          <p className="text-xs text-amber-500 mb-2">Cierra: {fmtFecha(s.fechaCierre)}</p>
        )}

        {/* Solo disponible si está PUBLICADO */}
        {s.estado === "PUBLICADO" ? (
          <Link
            href={`/dashboard/simulacro/${s.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition group-hover:shadow-md group-hover:shadow-blue-600/30"
          >
            <Play className="h-3.5 w-3.5 fill-white" />Iniciar simulacro
          </Link>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-400">
            Simulacro cerrado
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function SimulacrosListClient() {
  const [examenes, setExamenes] = useState<SimulacroCard[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filtro,   setFiltro]   = useState<Filtro>("todos");

  useEffect(() => {
    fetch("/api/dashboard/simulacros")
      .then((r) => r.json())
      .then((d) => setExamenes(d.examenes ?? []))
      .catch(() => setError("No se pudieron cargar los simulacros."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = examenes.filter((e) => {
    if (filtro === "disponibles") return !e.completado && !e.bloqueado;
    if (filtro === "completados") return e.completado;
    return true;
  });

  const totalCompletados = examenes.filter((e) => e.completado).length;
  const totalDisponibles = examenes.filter((e) => !e.completado && !e.bloqueado).length;

  const filtros: { id: Filtro; label: string }[] = [
    { id: "todos",       label: "Todos"       },
    { id: "disponibles", label: "Disponibles" },
    { id: "completados", label: "Completados" },
  ];

  return (
    <div className="px-4 md:px-6 py-6 space-y-5 max-w-6xl mx-auto">

      {/* Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3.5">
        <ClipboardList className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300 leading-relaxed">
          <span className="font-bold text-blue-200">¿Cómo funciona?</span>{" "}
          Las preguntas se envían en formato PDF. Usa este sistema como hoja de respuestas digital.
          Al enviar, el sistema califica automáticamente.
        </p>
      </div>

      {/* Stats */}
      {!loading && examenes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",       value: examenes.length,    color: "text-white"     },
            { label: "Disponibles", value: totalDisponibles,   color: "text-blue-400"  },
            { label: "Completados", value: totalCompletados,   color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-center">
              <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {filtros.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={cn("rounded-xl px-4 py-2 text-sm font-semibold transition",
              filtro === f.id
                ? "bg-blue-600 text-white"
                : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-white/20")}>
            {f.label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {filtrados.length} simulacro{filtrados.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <ClipboardList className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">No hay simulacros en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => <SimulacroCardItem key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}