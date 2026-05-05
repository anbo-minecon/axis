// components/dashboard/ResultadoDetalleClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  Trophy, Clock, Hash, TrendingUp, TrendingDown,
  Minus, BarChart3, AlertCircle, Loader2, Filter,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Pregunta {
  numero: number;
  respuestaCorrecta: string;
  respuestaDada: string | null;
  correcto: boolean;
}

interface Resumen {
  puntaje: number;
  total: number;
  pct: number;
  tiempoUsado: number;
  completadoEn: string;
  totalCorrectas: number;
  totalIncorrectas: number;
  sinResponder: number;
}

interface DetalleData {
  examen: { id: string; nombre: string; materia: string; tiempoMin: number };
  resumen: Resumen;
  preguntas: Pregunta[];
}

type Filtro = "todas" | "correctas" | "incorrectas" | "sin_responder";

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
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtTiempo(segs: number) {
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Fila de pregunta ───────────────────────────────────────────────────────
function PreguntaFila({ p }: { p: Pregunta }) {
  const sinResp = p.respuestaDada === null;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
      p.correcto
        ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
        : sinResp
        ? "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
        : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
    )}>
      {/* Ícono de estado */}
      <div className="shrink-0">
        {p.correcto ? (
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        ) : sinResp ? (
          <MinusCircle className="h-5 w-5 text-gray-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}
      </div>

      {/* Número */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8">
        <span className="text-xs font-bold text-[var(--text-muted)]">{p.numero}</span>
      </div>

      {/* Descripción */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Pregunta {p.numero}
        </p>
        <p className={cn(
          "text-xs mt-0.5",
          p.correcto ? "text-green-400" : sinResp ? "text-gray-600" : "text-red-400"
        )}>
          {p.correcto
            ? "Respuesta correcta"
            : sinResp
            ? "Sin responder"
            : "Respuesta incorrecta"}
        </p>
      </div>

      {/* Respuestas */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tu respuesta */}
        <div className="text-center">
          <p className="text-[10px] text-[var(--text-muted)] mb-1">Tu resp.</p>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold border",
            p.correcto
              ? "border-green-500/40 bg-green-500/20 text-green-300"
              : sinResp
              ? "border-white/10 bg-white/5 text-gray-600"
              : "border-red-500/40 bg-red-500/20 text-red-300"
          )}>
            {p.respuestaDada ?? "–"}
          </div>
        </div>

        {/* Flecha solo si es incorrecta */}
        {!p.correcto && !sinResp && (
          <span className="text-gray-600 text-sm">→</span>
        )}

        {/* Respuesta correcta (siempre visible si no acertó) */}
        {!p.correcto && (
          <div className="text-center">
            <p className="text-[10px] text-[var(--text-muted)] mb-1">Correcta</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-500/40 bg-green-500/20 text-sm font-extrabold text-green-300">
              {p.respuestaCorrecta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function ResultadoDetalleClient({ examenId }: { examenId: string }) {
  const [data, setData]       = useState<DetalleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filtro, setFiltro]   = useState<Filtro>("todas");

  useEffect(() => {
    fetch(`/api/dashboard/resultados/${examenId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("No se pudo cargar el detalle del resultado."))
      .finally(() => setLoading(false));
  }, [examenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error || "No se encontró el resultado."}
        </div>
      </div>
    );
  }

  const { examen, resumen, preguntas } = data;
  const nivel     = getNivel(resumen.pct);
  const NivelIcon = nivel.icon;

  const preguntasFiltradas = preguntas.filter((p) => {
    if (filtro === "correctas")     return p.correcto;
    if (filtro === "incorrectas")   return !p.correcto && p.respuestaDada !== null;
    if (filtro === "sin_responder") return p.respuestaDada === null;
    return true;
  });

  const filtros: { id: Filtro; label: string; count: number; color: string }[] = [
    { id: "todas",         label: "Todas",          count: preguntas.length,           color: "" },
    { id: "correctas",     label: "Correctas",      count: resumen.totalCorrectas,     color: "text-green-400" },
    { id: "incorrectas",   label: "Incorrectas",    count: resumen.totalIncorrectas,   color: "text-red-400" },
    { id: "sin_responder", label: "Sin responder",  count: resumen.sinResponder,       color: "text-gray-500" },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-5">

      {/* ── Volver ── */}
      <Link
        href="/dashboard/resultados"
        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a resultados
      </Link>

      {/* ── Header ── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 space-y-5">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{examen.nombre}</h1>
            <span className={cn(
              "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
              getMateriaColor(examen.materia)
            )}>
              {examen.materia}
            </span>
          </div>
          <div className={cn(
            "shrink-0 p-2.5 rounded-xl",
            resumen.pct >= 80 ? "bg-green-500/20" : resumen.pct >= 50 ? "bg-amber-500/20" : "bg-red-500/20"
          )}>
            <Trophy className={cn("h-5 w-5", nivel.color)} />
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          {/* Puntaje */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] mb-1.5">Puntaje</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              {resumen.puntaje}
              <span className="text-sm font-semibold text-gray-500"> /{resumen.total}</span>
            </p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full", nivel.barColor)}
                style={{ width: `${resumen.pct}%` }}
              />
            </div>
          </div>

          {/* % + nivel */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] mb-1.5">Aciertos</p>
            <p className={cn("text-xl font-extrabold", nivel.color)}>{resumen.pct}%</p>
            <p className={cn("flex items-center gap-1 text-xs font-semibold mt-1.5", nivel.color)}>
              <NivelIcon className="h-3 w-3" />
              {nivel.label}
            </p>
          </div>

          {/* Tiempo */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] mb-1.5">Tiempo</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              {fmtTiempo(resumen.tiempoUsado)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              de {examen.tiempoMin} min
            </p>
          </div>
        </div>

        {/* Fecha */}
        <p className="text-xs text-[var(--text-muted)]">
          Realizado el {fmtFecha(resumen.completadoEn)}
        </p>
      </div>

      {/* ── Resumen de respuestas ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-green-400">{resumen.totalCorrectas}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Correctas</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
          <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-red-400">{resumen.totalIncorrectas}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Incorrectas</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
          <MinusCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-gray-500">{resumen.sinResponder}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Sin resp.</p>
        </div>
      </div>

      {/* ── Preguntas ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden">

        {/* Header + filtros */}
        <div className="border-b border-white/10 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Revisión pregunta por pregunta
            </h2>
          </div>

          {/* Tabs de filtro */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
            {filtros.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  filtro === f.id
                    ? "bg-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"
                )}
              >
                {f.label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  filtro === f.id
                    ? "bg-white/20 text-white"
                    : "bg-white/10 " + (f.color || "text-[var(--text-muted)]")
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de preguntas */}
        <div className="p-4 space-y-2">
          {preguntasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">No hay preguntas en esta categoría</p>
            </div>
          ) : (
            preguntasFiltradas.map((p) => (
              <PreguntaFila key={p.numero} p={p} />
            ))
          )}
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/simulacros"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/10 transition"
        >
          Ver simulacros
        </Link>
        <Link
          href="/dashboard/estadisticas"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Ver estadísticas
        </Link>
      </div>
    </div>
  );
}