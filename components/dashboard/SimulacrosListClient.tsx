// components/dashboard/SimulacrosListClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Clock, Hash, Play, CheckCircle2,
  Lock, Trophy, TrendingUp, TrendingDown, Minus,
  AlertCircle, Loader2,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface SimulacroCard {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  fechaDisponible: string | null;
  bloqueado: boolean;
  completado: boolean;
  resultado: {
    puntaje: number;
    total: number;
    completadoEn: string;
  } | null;
}

type Filtro = "todos" | "disponibles" | "completados";

// ── Colores por materia ────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":          "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":      "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas":"bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":               "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

// ── Imagen por materia ─────────────────────────────────────────────────────
const MATERIA_IMAGEN_MAP: Record<string, string> = {
  "Matemáticas":          "/images/simulacro/matematicas.jpg",
  "Lectura Crítica":      "/images/simulacro/lectura-critica.jpg",
  "Ciencias Naturales":   "/images/simulacro/ciencias-naturales.jpg",
  "Sociales y Ciudadanas":"/images/simulacro/sociales-ciudadanas.jpg",
  "Inglés":               "/images/simulacro/ingles.jpg",
};

const getImagenSimulacro = (materia: string) =>
  MATERIA_IMAGEN_MAP[materia] ?? "/images/simulacro/default.jpg";

// ── Nivel según porcentaje ─────────────────────────────────────────────────
function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400", icon: TrendingUp };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400", icon: Minus };
  return           { label: "Nivel Bajo",  color: "text-red-400",   icon: TrendingDown };
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Card individual ────────────────────────────────────────────────────────
function SimulacroCardItem({ s }: { s: SimulacroCard }) {
  const pct   = s.resultado ? Math.round((s.resultado.puntaje / s.resultado.total) * 100) : 0;
  const nivel = s.resultado ? getNivel(pct) : null;

  // ── Imagen compartida ──
  const Imagen = () => (
    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
      <img
        src={getImagenSimulacro(s.materia)}
        alt={s.materia}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );

  // ── BLOQUEADO ──
  if (s.bloqueado) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] overflow-hidden opacity-60 select-none group">
        <Imagen />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-sm">{s.nombre}</h3>
              <span className={cn("mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMateriaColor(s.materia))}>
                {s.materia}
              </span>
            </div>
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

  // ── COMPLETADO ──
  if (s.completado && s.resultado) {
    const NivelIcon = nivel!.icon;
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-white/20 transition group">
        <Imagen />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-sm">{s.nombre}</h3>
              <span className={cn("mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMateriaColor(s.materia))}>
                {s.materia}
              </span>
            </div>
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.totalPreguntas} preguntas</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.tiempoMin} min</span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">Tu puntaje</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-[var(--text-primary)] dark:text-white">
                {s.resultado.puntaje}{" "}
                <span className="text-base font-semibold text-gray-500">/ {s.resultado.total}</span>
              </span>
              <span className={cn("flex items-center gap-1 text-xs font-bold", nivel!.color)}>
                <NivelIcon className="h-3.5 w-3.5" />
                {nivel!.label}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full transition-all",
                  pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-3">Realizado el: {fmtFecha(s.resultado.completadoEn)}</p>
          <Link
            href={`/dashboard/simulacro/${s.id}/resultado`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            <Trophy className="h-3.5 w-3.5" />
            Ver resultados
          </Link>
        </div>
      </div>
    );
  }

  // ── DISPONIBLE ──
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition group">
      <Imagen />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-sm">{s.nombre}</h3>
            <span className={cn("mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMateriaColor(s.materia))}>
              {s.materia}
            </span>
          </div>
          <Play className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{s.totalPreguntas} preguntas</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.tiempoMin} min</span>
        </div>
        {s.fechaDisponible && (
          <p className="text-xs text-gray-500 mb-3">Disponible desde: {fmtFecha(s.fechaDisponible)}</p>
        )}
        <Link
          href={`/dashboard/simulacro/${s.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition group-hover:shadow-md group-hover:shadow-blue-600/30"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          Iniciar simulacro
        </Link>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function SimulacrosListClient() {
  const [examenes, setExamenes] = useState<SimulacroCard[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filtro, setFiltro]     = useState<Filtro>("todos");

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

  const filtros: { id: Filtro; label: string }[] = [
    { id: "todos",       label: "Todos" },
    { id: "disponibles", label: "Disponibles" },
    { id: "completados", label: "Completados" },
  ];

  return (
    <div className="px-4 md:px-6 py-6 space-y-5 max-w-6xl mx-auto">

      {/* Banner explicativo */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3.5">
        <ClipboardList className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300 leading-relaxed">
          <span className="font-bold text-blue-200">¿Cómo funciona?</span>{" "}
          Las preguntas se envían en formato PDF. Utiliza este sistema como hoja de respuestas
          digital. Al enviar, el sistema califica automáticamente.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              filtro === f.id
                ? "bg-blue-600 text-white"
                : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-white/20"
            )}
          >
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
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <ClipboardList className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">No hay simulacros en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => (
            <SimulacroCardItem key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}