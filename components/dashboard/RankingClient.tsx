// components/dashboard/RankingClient.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Trophy, TrendingUp, TrendingDown, Minus, Users, Globe,
  Loader2, AlertCircle, Hash, Flame, CheckCheck, Medal,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface EntradaRanking {
  id: string;
  nombre: string;
  imagen: string | null;
  ciudad: string | null;
  colegio: string | null;
  grupo: string | null;
  simulacrosCompletados: number;
  oficiales: number;
  promedioPorc: number;
  puntajeEscalado: number;
  mejorPuntaje: number;
  rachaActual: number;
  posicion: number;
  esMiPerfil: boolean;
}

interface DatosRanking {
  ranking: EntradaRanking[];
  miPosicion: number | null;
  miEntrada: EntradaRanking | null;
  scope: string;
  total: number;
  materias: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getNivel(pct: number) {
  if (pct >= 80) return { color: "text-green-400",  bg: "bg-green-500",  icon: TrendingUp   };
  if (pct >= 60) return { color: "text-amber-400",  bg: "bg-amber-500",  icon: Minus        };
  return           { color: "text-red-400",    bg: "bg-red-500",    icon: TrendingDown };
}

function getInicialesColor(nombre: string) {
  const colors = [
    "bg-blue-600", "bg-purple-600", "bg-emerald-600",
    "bg-amber-600", "bg-red-600", "bg-cyan-600", "bg-indigo-600",
  ];
  const idx = nombre.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getInitials(nombre: string) {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const POSICION_STYLES: Record<number, { ring: string; bg: string; text: string; label: string }> = {
  1: { ring: "ring-2 ring-amber-400/60",  bg: "bg-amber-500/20",  text: "text-amber-400",  label: "🥇" },
  2: { ring: "ring-2 ring-gray-300/50",   bg: "bg-gray-400/20",   text: "text-gray-300",   label: "🥈" },
  3: { ring: "ring-2 ring-orange-500/50", bg: "bg-orange-500/20", text: "text-orange-400", label: "🥉" },
};

// ── Fila del ranking ───────────────────────────────────────────────────────
function FilaRanking({ entrada, esYo }: { entrada: EntradaRanking; esYo: boolean }) {
  const nivel     = getNivel(entrada.promedioPorc);
  const NivelIcon = nivel.icon;
  const posStyle  = POSICION_STYLES[entrada.posicion];

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3.5 transition-all",
      esYo
        ? "bg-indigo-500/10 border-l-2 border-indigo-500"
        : "hover:bg-white/[0.02] border-l-2 border-transparent",
    )}>
      {/* Posición */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold",
        posStyle ? posStyle.bg : "bg-white/5",
        posStyle ? posStyle.text : "text-gray-500",
      )}>
        {posStyle ? posStyle.label : `#${entrada.posicion}`}
      </div>

      {/* Avatar */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white",
        posStyle ? posStyle.ring : "",
        getInicialesColor(entrada.nombre),
      )}>
        {getInitials(entrada.nombre)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("min-w-0 text-sm font-bold truncate", esYo ? "text-indigo-300" : "text-white")}>
            {entrada.nombre}
            {esYo && <span className="ml-1 text-[9px] font-bold text-indigo-400">(Tú)</span>}
          </p>
          {entrada.oficiales > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 shrink-0">
              <CheckCheck className="h-2.5 w-2.5" />{entrada.oficiales} TRI
            </span>
          )}
          {entrada.rachaActual >= 3 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-bold text-orange-400 shrink-0">
              <Flame className="h-2.5 w-2.5" />{entrada.rachaActual}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5 flex-wrap">
          {entrada.colegio && <span className="truncate max-w-[140px]">{entrada.colegio}</span>}
          {entrada.grupo    && <span className="text-violet-500">{entrada.grupo}</span>}
          <span>{entrada.simulacrosCompletados} sim.</span>
        </div>
      </div>

      {/* Puntaje */}
      <div className="shrink-0 text-right">
        <p className={cn("text-lg font-extrabold", nivel.color)}>
          {entrada.puntajeEscalado}
          <span className="text-xs text-gray-600 font-normal">/500</span>
        </p>
        <p className={cn("flex items-center justify-end gap-0.5 text-[10px] font-semibold", nivel.color)}>
          <NivelIcon className="h-2.5 w-2.5" />{entrada.promedioPorc}%
        </p>
      </div>
    </div>
  );
}

// ── Mi posición fijada ─────────────────────────────────────────────────────
function MiPosicionCard({ entrada }: { entrada: EntradaRanking }) {
  const nivel     = getNivel(entrada.promedioPorc);
  const NivelIcon = nivel.icon;

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-sm font-extrabold text-indigo-300">
        #{entrada.posicion}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-indigo-200 truncate">{entrada.nombre}</p>
        <div className="flex items-center gap-2 text-[10px] text-indigo-400 mt-0.5 flex-wrap">
          <span>{entrada.simulacrosCompletados} simulacros</span>
          {entrada.oficiales > 0 && <span>{entrada.oficiales} TRI oficiales</span>}
          {entrada.rachaActual >= 3 && (
            <span className="flex items-center gap-0.5">
              <Flame className="h-2.5 w-2.5 text-orange-400" />Racha de {entrada.rachaActual}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-2xl font-extrabold", nivel.color)}>{entrada.puntajeEscalado}</p>
        <p className="text-[10px] text-indigo-400">{entrada.promedioPorc}% · /500</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function RankingClient({ userId, tieneGrupo }: {
  userId: string;
  tieneGrupo: boolean;
}) {
  const [datos,   setDatos]   = useState<DatosRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [scope,   setScope]   = useState<"global" | "grupo">("global");
  const [materia, setMateria] = useState("todas");

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ scope, materia, limit: "100" });
      const res    = await fetch(`/api/dashboard/ranking?${params}`);
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDatos(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el ranking.");
    } finally {
      setLoading(false);
    }
  }, [scope, materia]);

  useEffect(() => { cargar(); }, [cargar]);

  const top3     = datos?.ranking.slice(0, 3) ?? [];
  const resto    = datos?.ranking.slice(3)    ?? [];
  const miEntrada = datos?.miEntrada ?? null;
  // si mi posición no está en el top visible, mostrar fijada al final
  const miEstaEnTop100 = datos?.ranking.some((r) => r.id === userId);

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-5">

      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />Ranking
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Puntaje basado en TRI oficial cuando disponible, preliminar en otro caso.
        </p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Scope */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[var(--bg-card)] p-1">
          <button onClick={() => setScope("global")}
            className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              scope === "global" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white")}>
            <Globe className="h-3 w-3" />Global
          </button>
          {tieneGrupo && (
            <button onClick={() => setScope("grupo")}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                scope === "grupo" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white")}>
              <Users className="h-3 w-3" />Mi grupo
            </button>
          )}
        </div>

        {/* Materia */}
        {datos?.materias && datos.materias.length > 1 && (
          <select value={materia} onChange={(e) => setMateria(e.target.value)}
            className="rounded-xl border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="todas">Todas las materias</option>
            {datos.materias.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}

        {datos && (
          <span className="ml-auto text-xs text-gray-500">
            {datos.total} participante{datos.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : !datos || datos.ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Trophy className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">
            {scope === "grupo"
              ? "Nadie en tu grupo ha completado simulacros aún."
              : "Aún no hay participantes en el ranking."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Mi posición (siempre visible) ── */}
          {miEntrada && (
            <MiPosicionCard entrada={miEntrada} />
          )}

          {/* ── Podio top 3 ── */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-2">
              {/* 2° */}
              <div className="flex flex-col items-center gap-2 pt-6">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white", getInicialesColor(top3[1].nombre))}>
                  {getInitials(top3[1].nombre)}
                </div>
                <p className="text-[10px] text-gray-400 text-center truncate w-full px-1">{top3[1].nombre}</p>
                <div className="w-full rounded-t-xl bg-gray-400/20 border border-gray-400/30 pt-2 pb-3 text-center">
                  <p className="text-lg">🥈</p>
                  <p className="text-sm font-extrabold text-gray-300">{top3[1].puntajeEscalado}</p>
                  <p className="text-[10px] text-gray-500">{top3[1].promedioPorc}%</p>
                </div>
              </div>

              {/* 1° */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-sm font-extrabold text-white ring-2 ring-amber-400/60", getInicialesColor(top3[0].nombre))}>
                    {getInitials(top3[0].nombre)}
                  </div>
                  <span className="absolute -top-2 -right-2 text-sm">👑</span>
                </div>
                <p className="text-[10px] text-gray-300 text-center font-semibold truncate w-full px-1">{top3[0].nombre}</p>
                <div className="w-full rounded-t-xl bg-amber-500/20 border border-amber-400/30 pt-3 pb-3 text-center">
                  <p className="text-xl">🥇</p>
                  <p className="text-base font-extrabold text-amber-400">{top3[0].puntajeEscalado}</p>
                  <p className="text-[10px] text-amber-600">{top3[0].promedioPorc}%</p>
                </div>
              </div>

              {/* 3° */}
              {top3[2] && (
                <div className="flex flex-col items-center gap-2 pt-10">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white", getInicialesColor(top3[2].nombre))}>
                    {getInitials(top3[2].nombre)}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center truncate w-full px-1">{top3[2].nombre}</p>
                  <div className="w-full rounded-t-xl bg-orange-500/20 border border-orange-500/30 pt-2 pb-3 text-center">
                    <p className="text-lg">🥉</p>
                    <p className="text-sm font-extrabold text-orange-400">{top3[2].puntajeEscalado}</p>
                    <p className="text-[10px] text-orange-600">{top3[2].promedioPorc}%</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Lista completa ── */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden divide-y divide-white/5">
            {datos.ranking.map((entrada) => (
              <FilaRanking
                key={entrada.id}
                entrada={entrada}
                esYo={entrada.id === userId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}