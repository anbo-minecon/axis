// components/dashboard/RankingClient.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Trophy, Medal, Star, TrendingUp, Users, Globe,
  Loader2, AlertCircle, ClipboardList, BarChart2,
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
  promedioPorc: number;
  puntajeEscalado: number;
  mejorPuntaje: number;
  posicion: number;
}

interface RankingData {
  ranking: EntradaRanking[];
  miPosicion: number | null;
  scope: string;
}

type Scope = "global" | "grupo";

// ── Iniciales ──────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// ── Color de nivel por puntaje ─────────────────────────────────────────────
function getNivel(p: number) {
  if (p >= 400) return { label: "Alto",  cls: "text-green-400 bg-green-400/10 border-green-400/30" };
  if (p >= 250) return { label: "Medio", cls: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
  return           { label: "Bajo",  cls: "text-red-400 bg-red-400/10 border-red-400/30" };
}

// ── Medalla/trofeo por posición ────────────────────────────────────────────
function Medalla({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
  if (pos === 2) return <Medal  className="h-5 w-5 text-slate-300" />;
  if (pos === 3) return <Medal  className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold text-gray-500 tabular-nums w-5 text-center">#{pos}</span>;
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ nombre, imagen, size = "md" }: { nombre: string; imagen: string | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-16 w-16 text-lg" : size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  if (imagen) {
    return (
      <img
        src={imagen}
        alt={nombre}
        className={cn("rounded-full object-cover shrink-0", dim)}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={cn("rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0", dim)}>
      {getInitials(nombre)}
    </div>
  );
}

// ── Podio top 3 ───────────────────────────────────────────────────────────
function Podio({ top3, userId }: { top3: EntradaRanking[]; userId: string }) {
  // Orden del podio: 2 - 1 - 3
  const orden = [top3[1], top3[0], top3[2]].filter(Boolean);
  const alturas = { 0: "h-20", 1: "h-28", 2: "h-16" }; // 2do, 1ro, 3ro
  const posDisplay = [2, 1, 3];

  const colores = [
    "border-slate-400/30 bg-slate-400/10",   // 2do
    "border-amber-400/30 bg-amber-400/10",   // 1ro
    "border-amber-700/30 bg-amber-700/10",   // 3ro
  ];
  const textColores = ["text-slate-300", "text-amber-400", "text-amber-700"];

  return (
    <div className="flex items-end justify-center gap-3 pt-4 pb-2">
      {orden.map((e, i) => {
        const esYo = e?.id === userId;
        return (
          <div key={e?.id ?? i} className="flex flex-col items-center gap-2 w-28">
            {/* Avatar */}
            <div className={cn("relative", esYo && "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent rounded-full")}>
              <Avatar nombre={e?.nombre ?? ""} imagen={e?.imagen ?? null} size="lg" />
              {esYo && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                  Tú
                </span>
              )}
            </div>
            {/* Nombre */}
            <div className="text-center">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate w-full leading-tight">
                {e?.nombre.split(" ")[0]}
              </p>
              <p className={cn("text-xs font-extrabold", textColores[i])}>
                {e?.puntajeEscalado} pts
              </p>
            </div>
            {/* Barra del podio */}
            <div className={cn(
              "w-full rounded-t-xl border-t border-x flex items-start justify-center pt-2",
              alturas[i as 0 | 1 | 2],
              colores[i]
            )}>
              <span className={cn("text-lg font-extrabold", textColores[i])}>
                {posDisplay[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Fila de la tabla ───────────────────────────────────────────────────────
function FilaRanking({
  entrada,
  userId,
  animDelay,
}: {
  entrada: EntradaRanking;
  userId: string;
  animDelay: number;
}) {
  const esYo = entrada.id === userId;
  const nivel = getNivel(entrada.puntajeEscalado);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
        esYo
          ? "border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/20"
          : "border-white/8 bg-[var(--bg-card)] hover:border-white/15 hover:bg-white/[0.03]"
      )}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Posición */}
      <div className="flex w-8 shrink-0 items-center justify-center">
        <Medalla pos={entrada.posicion} />
      </div>

      {/* Avatar */}
      <Avatar nombre={entrada.nombre} imagen={entrada.imagen} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-bold truncate", esYo ? "text-blue-300" : "text-[var(--text-primary)]")}>
            {entrada.nombre}
            {esYo && <span className="ml-1 text-[10px] font-semibold text-blue-400">(Tú)</span>}
          </p>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
          {[entrada.colegio, entrada.ciudad].filter(Boolean).join(" · ") || entrada.grupo || "—"}
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)]">{entrada.simulacrosCompletados}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Simul.</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)]">{entrada.promedioPorc}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Promedio</p>
        </div>
      </div>

      {/* Puntaje + Nivel */}
      <div className="shrink-0 text-right">
        <p className="text-base font-extrabold text-[var(--text-primary)]">{entrada.puntajeEscalado}</p>
        <span className={cn("text-[10px] font-semibold border rounded-full px-1.5 py-0.5", nivel.cls)}>
          {nivel.label}
        </span>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function RankingClient({ userId, tieneGrupo }: { userId: string; tieneGrupo: boolean }) {
  const [scope, setScope]         = useState<Scope>("global");
  const [data, setData]           = useState<RankingData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const cargar = useCallback(async (s: Scope) => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/dashboard/ranking?scope=${s}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch {
      setError("No se pudo cargar el ranking.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(scope); }, [scope, cargar]);

  const top3    = data?.ranking.slice(0, 3) ?? [];
  const resto   = data?.ranking.slice(3)    ?? [];
  const miEntrada = data?.ranking.find((e) => e.id === userId);

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-5">

      {/* ── Tabs Global / Mi Grupo ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-1.5">
        {[
          { id: "global" as Scope, label: "Global", icon: Globe, disabled: false },
          { id: "grupo"  as Scope, label: "Mi Grupo", icon: Users, disabled: !tieneGrupo },
        ].map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            onClick={() => !disabled && setScope(id)}
            disabled={disabled}
            title={disabled ? "No tienes grupo asignado" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              scope === id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Mi posición (banner) ── */}
      {miEntrada && !loading && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/30">
              <Star className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-300 font-medium">Tu posición</p>
              <p className="text-lg font-extrabold text-white">
                  #{miEntrada.posicion}
                  <span className="text-sm font-normal text-blue-300 ml-1.5">
                    de {data?.ranking?.length ?? 0}
                  </span>
                </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-center">
            <div>
              <p className="text-base font-extrabold text-white">{miEntrada.puntajeEscalado}</p>
              <p className="text-[10px] text-blue-300">Puntaje</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-white">{miEntrada.promedioPorc}%</p>
              <p className="text-[10px] text-blue-300">Promedio</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-white">{miEntrada.simulacrosCompletados}</p>
              <p className="text-[10px] text-blue-300">Simulacros</p>
            </div>
          </div>
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
      ) : data?.ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Trophy className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">
            {scope === "grupo"
              ? "Nadie en tu grupo ha completado simulacros todavía."
              : "Aún no hay estudiantes en el ranking."}
          </p>
          <p className="text-xs text-gray-600">Completa tu primer simulacro para aparecer aquí.</p>
        </div>
      ) : (
        <>
          {/* Podio — solo si hay al menos 2 */}
          {top3.length >= 2 && (
            <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 pb-4">
              <div className="flex items-center gap-2 pt-4 pb-1 px-1">
                <Trophy className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-bold text-[var(--text-primary)]">Top 3</p>
              </div>
              <Podio top3={top3} userId={userId} />
            </div>
          )}

          {/* Lista completa */}
          <div className="space-y-2">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Clasificación completa
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                  {data?.ranking?.length ?? 0} estudiante{(data?.ranking?.length ?? 0) !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Top 3 en lista */}
            {top3.map((e, i) => (
              <FilaRanking key={e.id} entrada={e} userId={userId} animDelay={i * 40} />
            ))}

            {/* Separador si hay más */}
            {resto.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Continúa
                  </span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
                {resto.map((e, i) => (
                  <FilaRanking key={e.id} entrada={e} userId={userId} animDelay={(i + 3) * 40} />
                ))}
              </>
            )}
          </div>

          {/* Leyenda de puntaje */}
          <div className="rounded-2xl border border-white/8 bg-[var(--bg-card)] px-4 py-3">
            <p className="text-[11px] text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">
              Escala de puntaje (0 – 500)
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Nivel Alto",  rango: "400 – 500", cls: "text-green-400 bg-green-400/10 border-green-400/30" },
                { label: "Nivel Medio", rango: "250 – 399", cls: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
                { label: "Nivel Bajo",  rango: "0 – 249",   cls: "text-red-400 bg-red-400/10 border-red-400/30" },
              ].map(({ label, rango, cls }) => (
                <div key={label} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1", cls)}>
                  <span className="text-[10px] font-bold">{label}</span>
                  <span className="text-[10px] opacity-70">{rango}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">
              El puntaje es el promedio de todos tus simulacros completados, escalado a 500.
            </p>
          </div>
        </>
      )}
    </div>
  );
}