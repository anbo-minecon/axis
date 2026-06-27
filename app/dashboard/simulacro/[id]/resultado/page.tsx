// app/dashboard/simulacro/[id]/resultado/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Resultado del Simulacro | AXIS Pre-ICFES" };

export const dynamic = "force-dynamic";

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400", bg: "bg-green-500/20", icon: TrendingUp };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400", bg: "bg-amber-500/20", icon: Minus };
  return           { label: "Nivel Bajo",  color: "text-red-400",   bg: "bg-red-500/20",   icon: TrendingDown };
}

function fmtTiempo(segs: number) {
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Recalcular puntaje preliminar para datos históricos ────────────────────
function recalcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0 || aciertos <= 0) return 0;
  return Math.round(Math.pow(aciertos / total, 1.5) * 100);
}

// ── Obtener puntaje efectivo (TRI si oficial, prelim si no) ────────────────
function puntajeEfectivo(r: {
  estadoCalif: string;
  puntajeTRI: number | null;
  puntajePreliminar: number;
  puntaje: number;
  total: number;
}): number {
  if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
    return Math.round(Number(r.puntajeTRI));
  if (r.puntajePreliminar > 0)
    return Math.round(r.puntajePreliminar);
  if (r.puntaje > 0 && r.total > 0)
    return recalcularPreliminar(r.puntaje, r.total);
  return 0;
}

export default async function ResultadoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const resultado = await (db as any).resultadoSimulacro.findUnique({
    where: {
      estudianteId_examenId: {
        estudianteId: session.user.id,
        examenId: params.id,
      },
    },
    include: {
      examen: {
        select: {
          id: true,
          nombre: true,
          materia: true,
          tiempoMin: true,
        },
      },
    },
  });

  if (!resultado) redirect("/dashboard/simulacros");

  // Usar puntajeEfectivo: TRI si oficial, puntajePreliminar si no
  const pct   = puntajeEfectivo({
    estadoCalif:       resultado.estadoCalif ?? "PRELIMINAR",
    puntajeTRI:        resultado.puntajeTRI ?? null,
    puntajePreliminar: resultado.puntajePreliminar ?? 0,
    puntaje:           resultado.puntaje ?? 0,
    total:             resultado.total ?? 0,
  });
  const puntajeEscalado = Math.round((pct / 100) * 500);
  const nivel = getNivel(pct);
  const NivelIcon = nivel.icon;
  const esOficial = resultado.estadoCalif === "OFICIAL";

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto space-y-5">

      {/* Volver */}
      <Link
        href="/dashboard/simulacros"
        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a simulacros
      </Link>

      {/* ── Card principal ── */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 sm:p-8 space-y-6">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {resultado.examen.nombre}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{resultado.examen.materia}</p>
            <span className="inline-flex mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {resultado.estadoCalif ?? "PRELIMINAR"}
            </span>
          </div>
          <div className={cn("shrink-0 p-3 rounded-xl", nivel.bg)}>
            <Trophy className={cn("h-6 w-6", nivel.color)} />
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Puntaje */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {esOficial ? "Puntaje TRI oficial" : "Puntaje preliminar"}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">
                {puntajeEscalado}
              </span>
              <span className="text-lg text-gray-500 font-semibold">/ 500</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full",
                  pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
            {esOficial && (
              <p className="text-[10px] text-emerald-400 mt-2 font-semibold">
                ✓ Calculado con modelo TRI
              </p>
            )}
          </div>

          {/* Porcentaje */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">Porcentaje de aciertos</p>
            <span className={cn("text-4xl font-extrabold", nivel.color)}>{pct}%</span>
            <div className={cn("mt-3 flex items-center gap-1.5 text-sm font-semibold", nivel.color)}>
              <NivelIcon className="h-4 w-4" />
              {nivel.label}
            </div>
          </div>

          {/* Tiempo */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">Tiempo usado</p>
            <span className="text-4xl font-extrabold text-[var(--text-primary)]">
              {fmtTiempo(resultado.tiempoUsado)}
            </span>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Límite: {resultado.examen.tiempoMin} min
            </p>
          </div>
        </div>
      </div>

      {/* ── Análisis de respuestas ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          Análisis de respuestas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-5 py-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Correctas</p>
              <p className="text-3xl font-extrabold text-green-400">{resultado.puntaje}</p>
            </div>
          </div>

          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Incorrectas</p>
              <p className="text-3xl font-extrabold text-red-400">
                {resultado.total - resultado.puntaje}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/simulacros"
          className="flex-1 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/10 transition"
        >
          Ver más simulacros
        </Link>
        <Link
          href="/dashboard/estadisticas"
          className="flex-1 flex items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Ver estadísticas
        </Link>
      </div>
    </div>
  );
}