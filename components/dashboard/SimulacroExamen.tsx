// components/dashboard/SimulacroExamen.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Clock, Maximize2, Minimize2, AlertTriangle, ChevronLeft,
  ChevronRight, CheckCircle2, Send, Trophy,
  TrendingUp, TrendingDown, Minus, Home, Loader2,
  Info, BookOpen, Layers,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
type Respuesta = "A" | "B" | "C" | "D";
type Fase = "inicio" | "examen" | "enviando" | "resultado_sesion" | "resultado_final";

interface SesionInfo {
  id: string;
  numero: number;
  nombre: string;
  tiempoMin: number;
  totalPreguntas: number;
}

interface ExamenInfo {
  id: string;
  nombre: string;
  materia: string;
  tiempoMin: number;
  totalPreguntas: number;
  tieneSesiones: boolean;
  sesiones: SesionInfo[];
}

interface ResultadoSesion {
  puntajePreliminar: number;
  correctas: number;
  total: number;
  detalles: Record<string, { dada: string | null; correcta: string; correcto: boolean }>;
  completoSimulacro: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTiempo(segs: number): string {
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto",  color: "text-green-400",  bg: "bg-green-500",  icon: TrendingUp  };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400",  bg: "bg-amber-500",  icon: Minus       };
  return           { label: "Nivel Bajo",  color: "text-red-400",    bg: "bg-red-500",    icon: TrendingDown };
}

const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-300 border-violet-500/30",
};
const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

// ── Modal de confirmación ──────────────────────────────────────────────────
function Modal({ titulo, mensaje, confirmLabel, confirmClass, onConfirm, onCancel }: {
  titulo: string; mensaje: string; confirmLabel: string;
  confirmClass?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-white">{titulo}</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{mensaje}</p>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition">
            Cancelar
          </button>
          <button onClick={onConfirm} className={cn("flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition", confirmClass ?? "bg-red-600 hover:bg-red-700")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resultado intermedio entre sesiones ───────────────────────────────────
function PantallaResultadoSesion({ sesionActual, resultado, examen, onSiguiente }: {
  sesionActual: SesionInfo; resultado: ResultadoSesion;
  examen: ExamenInfo; onSiguiente: () => void;
}) {
  const nivel      = getNivel(resultado.puntajePreliminar);
  const NivelIcon  = nivel.icon;
  const siguiente  = examen.sesiones.find((s) => s.numero === sesionActual.numero + 1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-lg space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Sesión completada</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{sesionActual.nombre}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Puntaje preliminar (Sesión {sesionActual.numero})</p>
            <div className="flex items-end justify-between">
              <span className={cn("text-4xl font-extrabold", nivel.color)}>
                {Math.round((resultado.puntajePreliminar / 100) * 500)}
                <span className="text-lg text-gray-500 font-normal"> / 500</span>
              </span>
              <span className={cn("flex items-center gap-1 text-sm font-bold", nivel.color)}>
                <NivelIcon className="h-4 w-4" />{nivel.label}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", nivel.bg)} style={{ width: `${resultado.puntajePreliminar}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-green-400">{resultado.correctas}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Correctas</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-red-400">{resultado.total - resultado.correctas}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Incorrectas</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Puntaje <strong>preliminar</strong>. El oficial se calcula al cerrar el simulacro con el modelo TRI,
              considerando la dificultad de cada pregunta y el desempeño del grupo.
            </p>
          </div>

          {siguiente ? (
            <button onClick={onSiguiente} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition">
              <Maximize2 className="h-4 w-4" />
              Continuar con {siguiente.nombre}
            </button>
          ) : (
            <p className="text-center text-xs text-[var(--text-muted)]">Cargando resultado final…</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de inicio ─────────────────────────────────────────────────────
function PantallaInicio({ examen, sesionActual, onIniciar }: {
  examen: ExamenInfo; sesionActual: SesionInfo; onIniciar: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-8 space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
            <Trophy className="h-7 w-7 text-blue-400" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{examen.nombre}</h1>
            {/* Badge materia */}
            <span className={cn(
              "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              getMateriaColor(examen.tieneSesiones ? "Multi-materia" : examen.materia),
            )}>
              {examen.tieneSesiones ? "Multi-materia" : examen.materia}
            </span>
          </div>

          {/* Estructura sesiones */}
          {examen.tieneSesiones && examen.sesiones.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Estructura del simulacro
              </p>
              {examen.sesiones.map((s) => (
                <div key={s.id} className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  s.numero === sesionActual.numero
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-white/8 bg-white/[0.02]",
                )}>
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                    s.numero === sesionActual.numero ? "bg-blue-600 text-white" : "bg-white/10 text-gray-500",
                  )}>
                    {s.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", s.numero === sesionActual.numero ? "text-blue-300" : "text-gray-500")}>
                      {s.nombre}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {s.totalPreguntas} preguntas · {s.tiempoMin} min
                    </p>
                  </div>
                  {s.numero < sesionActual.numero && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                  {s.numero === sesionActual.numero && <span className="text-[10px] font-bold text-blue-400 shrink-0">En curso</span>}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />Preguntas
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{sesionActual.totalPreguntas}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />Tiempo
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{sesionActual.tiempoMin} min</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 space-y-1.5">
            {[
              "Consulta las preguntas en el cuadernillo PDF.",
              "Selecciona tu respuesta en esta pantalla.",
              "La pantalla completa se activa automáticamente.",
              "Si sales, el simulacro se interrumpirá.",
            ].map((t, i) => (
              <p key={i} className="flex items-start gap-2 text-xs text-blue-300">
                <Info className="h-3 w-3 shrink-0 mt-0.5 text-blue-400" />{t}
              </p>
            ))}
          </div>

          <button
            onClick={onIniciar}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-lg shadow-blue-600/30"
          >
            <Maximize2 className="h-4 w-4" />
            {examen.tieneSesiones ? `Iniciar ${sesionActual.nombre}` : "Iniciar simulacro en pantalla completa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resultado final ────────────────────────────────────────────────────────
function PantallaResultadoFinal({ examen, resultadosPorSesion, router }: {
  examen: ExamenInfo;
  resultadosPorSesion: { sesion: SesionInfo; resultado: ResultadoSesion }[];
  router: ReturnType<typeof useRouter>;
}) {
  const promedioGlobal = resultadosPorSesion.length > 0
    ? Math.round(resultadosPorSesion.reduce((a, r) => a + r.resultado.puntajePreliminar, 0) / resultadosPorSesion.length)
    : 0;
  const promedioGlobalEscalado = Math.round((promedioGlobal / 100) * 500);
  const nivel     = getNivel(promedioGlobal);
  const NivelIcon = nivel.icon;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-sm font-semibold text-green-400">Simulacro completado</p>
          </div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{examen.nombre}</h1>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Puntaje global preliminar</p>
              <p className={cn("text-5xl font-extrabold", nivel.color)}>
                {promedioGlobalEscalado}
                <span className="text-2xl text-gray-500 font-semibold"> / 500</span>
              </p>
            </div>
            <div className="text-right">
              <p className={cn("flex items-center gap-1 justify-end text-sm font-bold", nivel.color)}>
                <NivelIcon className="h-4 w-4" />{nivel.label}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Resultado preliminar</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full rounded-full", nivel.bg)} style={{ width: `${promedioGlobal}%` }} />
          </div>
        </div>

        {resultadosPorSesion.length > 1 && (
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Puntaje por sesión</h2>
            {resultadosPorSesion.map(({ sesion, resultado }) => {
              const n = getNivel(resultado.puntajePreliminar);
              const puntajeEscaladoSesion = Math.round((resultado.puntajePreliminar / 100) * 500);
              return (
                <div key={sesion.id} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-xs font-bold text-blue-400">
                    {sesion.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{sesion.nombre}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className={cn("h-full rounded-full", n.bg)} style={{ width: `${resultado.puntajePreliminar}%` }} />
                    </div>
                  </div>
                  <span className={cn("text-sm font-extrabold shrink-0", n.color)}>
                    {puntajeEscaladoSesion}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Resultado preliminar</p>
            <p className="text-xs text-amber-400 mt-1">
              Tu puntaje oficial se calculará cuando el simulacro cierre, usando el modelo TRI.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/simulacros")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <Home className="h-4 w-4" />Volver a Simulacros
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function SimulacroExamen({ examen }: { examen: ExamenInfo }) {
  const router = useRouter();

  const sesiones = examen.tieneSesiones && examen.sesiones.length > 0
    ? examen.sesiones
    : [{ id: "default", numero: 1, nombre: examen.nombre, tiempoMin: examen.tiempoMin, totalPreguntas: examen.totalPreguntas }];

  const [sesionIdx, setSesionIdx]     = useState(0);
  const sesionActual                  = sesiones[sesionIdx];

  const [fase,             setFase]             = useState<Fase>("inicio");
  const [preguntaActual,   setPreguntaActual]   = useState(1);
  const [respuestas,       setRespuestas]       = useState<Record<number, Respuesta>>({});
  const [tiempoRestante,   setTiempoRestante]   = useState(sesionActual.tiempoMin * 60);
  const [tiempoUsado,      setTiempoUsado]      = useState(0);
  const [isFullscreen,     setIsFullscreen]     = useState(false);
  const [showExitModal,    setShowExitModal]    = useState(false);
  const [showEnviarModal,  setShowEnviarModal]  = useState(false);
  const [resultadoSesionActual, setResultadoSesion] = useState<ResultadoSesion | null>(null);
  const [resultadosPorSesion,   setResultadosPorSesion] = useState<{ sesion: SesionInfo; resultado: ResultadoSesion }[]>([]);

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const tiempoInicioRef = useRef<number>(0);

  const totalPreguntas = sesionActual.totalPreguntas;
  const respondidas    = Object.keys(respuestas).length;
  const progresoPct    = Math.round((respondidas / totalPreguntas) * 100);

  useEffect(() => {
    setFase("inicio");
    setPreguntaActual(1);
    setRespuestas({});
    setTiempoRestante(sesionActual.tiempoMin * 60);
    setTiempoUsado(0);
  }, [sesionIdx, sesionActual.tiempoMin]);

  const entrarFullscreen = useCallback(async () => {
    try { await document.documentElement.requestFullscreen?.(); } catch { /* ok */ }
  }, []);
  const salirFullscreen = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen?.(); } catch { /* ok */ }
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const iniciarTimer = useCallback(() => {
    tiempoInicioRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); enviarSesion(); return 0; }
        setTiempoUsado(Math.floor((Date.now() - tiempoInicioRef.current) / 1000));
        return prev - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line

  const detenerTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => () => detenerTimer(), [detenerTimer]);

  useEffect(() => {
    if (fase !== "examen") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [fase]);

  const handleIniciar = async () => {
    await entrarFullscreen();
    setFase("examen");
    iniciarTimer();
  };

  const enviarSesion = async () => {
    detenerTimer();
    const usados = Math.floor((Date.now() - tiempoInicioRef.current) / 1000);
    setTiempoUsado(usados);
    setFase("enviando");

    const respObj: Record<string, string> = {};
    for (const [k, v] of Object.entries(respuestas)) {
      if (v === "A" || v === "B" || v === "C" || v === "D") {
        respObj[String(k)] = v;
      }
    }

    const endpoint = examen.tieneSesiones
      ? `/api/dashboard/simulacros/${examen.id}/sesion/${sesionActual.numero}/enviar`
      : `/api/dashboard/simulacros/${examen.id}/enviar`;

    try {
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ respuestas: respObj, tiempoUsado: usados }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const nuevosResultados = [...resultadosPorSesion, { sesion: { ...sesionActual }, resultado: data }];
      setResultadosPorSesion(nuevosResultados);
      setResultadoSesion(data);

      if (data.completoSimulacro || !examen.tieneSesiones) {
        await salirFullscreen();
        setFase("resultado_final");
      } else {
        await salirFullscreen();
        setFase("resultado_sesion");
      }
    } catch (err: any) {
      alert(err?.message ?? "Error al enviar. Intenta de nuevo.");
      setFase("examen");
      iniciarTimer();
    }
  };

  const handleSiguienteSesion = async () => {
    const siguiente = sesionIdx + 1;
    if (siguiente < sesiones.length) {
      setSesionIdx(siguiente);
      setFase("inicio");
      setResultadoSesion(null);
    }
  };

  const timerColor = tiempoRestante < 300 ? "text-red-400" : tiempoRestante < 600 ? "text-amber-400" : "text-[var(--text-primary)]";

  // ── Renders por fase ──────────────────────────────────────────────────────
  if (fase === "inicio")
    return <PantallaInicio examen={examen} sesionActual={sesionActual as SesionInfo} onIniciar={handleIniciar} />;

  if (fase === "enviando")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Calificando…</p>
        </div>
      </div>
    );

  if (fase === "resultado_sesion" && resultadoSesionActual)
    return <PantallaResultadoSesion sesionActual={sesionActual as SesionInfo} resultado={resultadoSesionActual} examen={examen} onSiguiente={handleSiguienteSesion} />;

  if (fase === "resultado_final")
    return <PantallaResultadoFinal examen={examen} resultadosPorSesion={resultadosPorSesion as any} router={router} />;

  // ── FASE: EXAMEN ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">

      {showExitModal && (
        <Modal titulo="¿Salir del simulacro?" mensaje="Si sales ahora perderás tu progreso en esta sesión."
          confirmLabel="Sí, salir" confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={async () => { detenerTimer(); await salirFullscreen(); router.push("/dashboard/simulacros"); }}
          onCancel={() => setShowExitModal(false)} />
      )}
      {showEnviarModal && (
        <Modal
          titulo={respondidas < totalPreguntas ? `Tienes ${totalPreguntas - respondidas} sin responder` : "¿Enviar sesión?"}
          mensaje={respondidas < totalPreguntas ? "Las preguntas sin responder contarán como incorrectas." : "Una vez enviada, no podrás modificar las respuestas."}
          confirmLabel="Enviar" confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={() => { setShowEnviarModal(false); enviarSesion(); }}
          onCancel={() => setShowEnviarModal(false)} />
      )}

      {/* ── Panel izquierdo ── */}
      <aside className="flex w-[220px] sm:w-[250px] shrink-0 flex-col border-r border-white/10 bg-[var(--bg-card)] overflow-hidden">

        {/* Nombre + MATERIA + SESIÓN */}
        <div className="border-b border-white/10 px-4 py-3 space-y-1.5">
          <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">{examen.nombre}</p>

          {/* Badge materia */}
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            getMateriaColor(examen.tieneSesiones ? "Multi-materia" : examen.materia),
          )}>
            <BookOpen className="h-2.5 w-2.5" />
            {examen.tieneSesiones ? "Multi-materia" : examen.materia}
          </span>

          {/* Badge sesión actual */}
          {examen.tieneSesiones && (
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-[9px] font-extrabold text-white">
                {sesionActual.numero}
              </span>
              <span className="text-[10px] text-blue-300 font-semibold truncate">{sesionActual.nombre}</span>
            </div>
          )}

          {/* Mini progreso sesiones */}
          {examen.tieneSesiones && sesiones.length > 1 && (
            <div className="flex items-center gap-1 mt-1">
              {sesiones.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    s.numero < sesionActual.numero  ? "bg-green-500"
                    : s.numero === sesionActual.numero ? "bg-blue-500"
                    : "bg-white/10",
                  )}
                />
              ))}
              <span className="text-[9px] text-gray-600 ml-1 shrink-0">
                {sesionActual.numero}/{sesiones.length}
              </span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Tiempo restante</span>
            </div>
            <button
              onClick={async () => { isFullscreen ? await salirFullscreen() : await entrarFullscreen(); }}
              className="text-gray-600 hover:text-[var(--text-primary)] transition"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className={cn("text-2xl font-mono font-extrabold tabular-nums", timerColor)}>
            {formatTiempo(tiempoRestante)}
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-all duration-1000",
                tiempoRestante < 300 ? "bg-red-500" : tiempoRestante < 600 ? "bg-amber-500" : "bg-blue-500")}
              style={{ width: `${(tiempoRestante / (sesionActual.tiempoMin * 60)) * 100}%` }}
            />
          </div>
        </div>

        {/* Progreso preguntas */}
        <div className="border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--text-muted)]">{respondidas}/{totalPreguntas} resp.</span>
            <span className="font-bold text-[var(--text-primary)]">{progresoPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progresoPct}%` }} />
          </div>
        </div>

        {/* Grid de preguntas */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">Hoja de respuestas</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalPreguntas }, (_, i) => i + 1).map((n) => {
              const resp     = respuestas[n];
              const isActual = n === preguntaActual;
              return (
                <button
                  key={n}
                  onClick={() => setPreguntaActual(n)}
                  className={cn("aspect-square rounded-lg text-xs font-bold transition-all",
                    isActual ? "ring-2 ring-blue-500 bg-blue-600 text-white"
                    : resp    ? "bg-blue-500/25 text-blue-300 hover:bg-blue-500/40"
                    :           "bg-white/5 text-[var(--text-muted)] hover:bg-white/10",
                  )}
                >
                  {resp ? resp : n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="border-t border-white/10 px-3 py-2.5 space-y-1">
          {[
            { color: "bg-blue-600",    label: "Actual"        },
            { color: "bg-blue-500/25", label: "Respondida"    },
            { color: "bg-white/5",     label: "Sin responder" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded shrink-0", color)} />
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Panel derecho ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header con materia + sesión visibles */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[var(--bg-card)] px-4 py-3 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[var(--text-primary)] shrink-0">
              P{preguntaActual}
              <span className="text-[var(--text-muted)] font-normal"> / {totalPreguntas}</span>
            </span>
            {/* Materia en el header */}
            <span className={cn(
              "hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0",
              getMateriaColor(examen.tieneSesiones ? "Multi-materia" : examen.materia),
            )}>
              <BookOpen className="h-2.5 w-2.5" />
              {examen.tieneSesiones ? "Multi-materia" : examen.materia}
            </span>
            {/* Sesión en el header */}
            {examen.tieneSesiones && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300 shrink-0">
                <Layers className="h-2.5 w-2.5" />
                Sesión {sesionActual.numero} de {sesiones.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowExitModal(true)}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              Salir
            </button>
            <button
              onClick={() => setShowEnviarModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar {examen.tieneSesiones ? "sesión" : ""}
            </button>
          </div>
        </div>

        {/* Contenido pregunta */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">

            {/* Instrucción cuadernillo */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/30 text-xs font-bold text-blue-300">📄</div>
                <div>
                  <p className="text-sm font-bold text-blue-200">
                    Consulta la <span className="text-white">pregunta {preguntaActual}</span> en el cuadernillo PDF.
                  </p>
                  <p className="text-xs text-blue-400 mt-1">El cuadernillo fue enviado por tu docente antes de la sesión.</p>
                </div>
              </div>
            </div>

            {/* Opciones A B C D */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-4">Selecciona tu respuesta:</p>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as Respuesta[]).map((op) => {
                  const selected = respuestas[preguntaActual] === op;
                  return (
                    <button
                      key={op}
                      onClick={() => setRespuestas((prev) => ({
                        ...prev,
                        [preguntaActual]: prev[preguntaActual] === op ? (undefined as any) : op,
                      }))}
                      className={cn(
                        "flex items-center justify-center rounded-2xl border py-6 text-2xl font-extrabold transition-all active:scale-[0.97]",
                        selected
                          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : "border-white/10 bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white",
                      )}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso sin responder */}
            {respondidas < totalPreguntas && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">
                  Tienes <span className="font-bold">{totalPreguntas - respondidas}</span> preguntas sin responder.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav inferior */}
        <div className="border-t border-white/10 bg-[var(--bg-card)] px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPreguntaActual((p) => Math.max(1, p - 1))}
              disabled={preguntaActual === 1}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />Anterior
            </button>
            <span className="text-xs text-[var(--text-muted)]">{preguntaActual} / {totalPreguntas}</span>
            <button
              onClick={() => {
                if (preguntaActual === totalPreguntas) setShowEnviarModal(true);
                else setPreguntaActual((p) => Math.min(totalPreguntas, p + 1));
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                preguntaActual === totalPreguntas
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-white/10 bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10",
              )}
            >
              {preguntaActual === totalPreguntas
                ? <><Send className="h-4 w-4" />Enviar</>
                : <>Siguiente<ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}