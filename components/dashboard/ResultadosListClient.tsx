// components/dashboard/ResultadosListClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Trophy, TrendingUp, TrendingDown, Minus, Clock,
  Hash, ChevronRight, AlertCircle, Loader2, ClipboardList,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface ResultadoCard {
  id: string;
  nombre: string;
  materia: string;
  tiempoMin: number;
  totalPreguntas: number;
  puntaje: number;
  total: number;
  pct: number;
  tiempoUsado: number;
  completadoEn: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};
const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400",  barColor: "bg-green-500",  icon: TrendingUp };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400",  barColor: "bg-amber-500",  icon: Minus };
  return           { label: "Nivel Bajo",  color: "text-red-400",    barColor: "bg-red-500",    icon: TrendingDown };
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTiempo(segs: number) {
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ── Card ───────────────────────────────────────────────────────────────────
function ResultadoCardItem({ r }: { r: ResultadoCard }) {
  const nivel    = getNivel(r.pct);
  const NivelIcon = nivel.icon;

  return (
    <Link
      href={`/dashboard/resultados/${r.id}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-[var(--bg-card)] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition overflow-hidden"
    >
      {/* Barra de color superior según nivel */}
      <div className={cn("h-1 w-full", nivel.barColor)} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">
              {r.nombre}
            </h3>
            <span className={cn(
              "mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              getMateriaColor(r.materia)
            )}>
              {r.materia}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-400 transition shrink-0 mt-0.5" />
        </div>

        {/* Puntaje grande + nivel */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Puntaje</p>
            <p className="text-2xl font-extrabold text-[var(--text-primary)]">
              {r.puntaje}
              <span className="text-base font-semibold text-gray-500"> / {r.total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-extrabold", nivel.color)}>{r.pct}%</p>
            <p className={cn("flex items-center justify-end gap-1 text-xs font-semibold mt-0.5", nivel.color)}>
              <NivelIcon className="h-3.5 w-3.5" />
              {nivel.label}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full transition-all", nivel.barColor)}
            style={{ width: `${r.pct}%` }}
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-white/8">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />{r.total} preguntas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{fmtTiempo(r.tiempoUsado)}
            </span>
          </div>
          <span>{fmtFecha(r.completadoEn)}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function ResultadosListClient() {
  const [resultados, setResultados] = useState<ResultadoCard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filtro, setFiltro]         = useState<"todos" | "alto" | "medio" | "bajo">("todos");

  useEffect(() => {
    fetch("/api/dashboard/resultados")
      .then((r) => r.json())
      .then((d) => setResultados(d.resultados ?? []))
      .catch(() => setError("No se pudieron cargar los resultados."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = resultados.filter((r) => {
    if (filtro === "alto")  return r.pct >= 80;
    if (filtro === "medio") return r.pct >= 50 && r.pct < 80;
    if (filtro === "bajo")  return r.pct < 50;
    return true;
  });

  // Calcular resumen rápido
  const totalCompletados = resultados.length;
  const promedio = totalCompletados > 0
    ? Math.round(resultados.reduce((a, r) => a + r.pct, 0) / totalCompletados)
    : 0;
  const altos  = resultados.filter((r) => r.pct >= 80).length;
  const medios = resultados.filter((r) => r.pct >= 50 && r.pct < 80).length;
  const bajos  = resultados.filter((r) => r.pct < 50).length;

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-6">

      {/* ── Resumen rápido (solo si hay datos) ── */}
      {!loading && totalCompletados > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Completados", value: String(totalCompletados), color: "text-[var(--text-primary)]" },
            { label: "Promedio",    value: `${promedio}%`,           color: promedio >= 80 ? "text-green-400" : promedio >= 50 ? "text-amber-400" : "text-red-400" },
            { label: "Nivel Alto",  value: String(altos),            color: "text-green-400" },
            { label: "Para mejorar",value: String(bajos),            color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-center">
              <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ── */}
      {!loading && totalCompletados > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "todos",  label: "Todos" },
            { id: "alto",   label: "Nivel Alto" },
            { id: "medio",  label: "Nivel Medio" },
            { id: "bajo",   label: "Para mejorar" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id as any)}
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
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Contenido ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : totalCompletados === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20">
            <Trophy className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <p className="text-base font-bold text-[var(--text-primary)]">Sin resultados aún</p>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
              Completa tu primer simulacro para ver tus resultados aquí.
            </p>
          </div>
          <Link
            href="/dashboard/simulacros"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <ClipboardList className="h-4 w-4" />
            Ver simulacros disponibles
          </Link>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Trophy className="h-10 w-10 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">No hay resultados en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((r) => (
            <ResultadoCardItem key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}