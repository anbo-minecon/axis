// components/dashboard/SimulacroExamen.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Clock, Maximize2, Minimize2, AlertTriangle, ChevronLeft,
  ChevronRight, CheckCircle2, XCircle, Send, RotateCcw,
  Trophy, TrendingUp, TrendingDown, Minus, Home, Hash,
  Loader2, Info,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
type Respuesta = "A" | "B" | "C" | "D";
type Fase = "inicio" | "examen" | "enviando" | "resultado";

interface ExamenInfo {
  id: string;
  nombre: string;
  materia: string;
  tiempoMin: number;
  totalPreguntas: number;
}

interface Detalle {
  dada: string | null;
  correcta: string;
  correcto: boolean;
}

interface ResultadoFinal {
  puntaje: number;
  total: number;
  porcentaje: number;
  detalles: Record<string, Detalle>;
}

interface Props {
  examen: ExamenInfo;
}

// ── Utilidades ─────────────────────────────────────────────────────────────
function formatTiempo(segs: number): string {
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Nivel Alto", color: "text-green-400", bg: "bg-green-500", icon: TrendingUp };
  if (pct >= 50) return { label: "Nivel Medio", color: "text-amber-400", bg: "bg-amber-500", icon: Minus };
  return { label: "Nivel Bajo", color: "text-red-400", bg: "bg-red-500", icon: TrendingDown };
}

// ── Modal de confirmación ──────────────────────────────────────────────────
function Modal({
  titulo,
  mensaje,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  titulo: string;
  mensaje: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
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
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition",
              confirmClass ?? "bg-red-600 hover:bg-red-700"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de inicio ─────────────────────────────────────────────────────
function PantallaInicio({
  examen,
  onIniciar,
}: {
  examen: ExamenInfo;
  onIniciar: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-8 space-y-6">
          {/* Icono */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
            <Trophy className="h-7 w-7 text-blue-400" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{examen.nombre}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{examen.materia}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash, label: "Preguntas", value: String(examen.totalPreguntas) },
              { icon: Clock, label: "Tiempo límite", value: `${examen.tiempoMin} min` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3" />{label}
                </p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Instrucciones */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 space-y-1.5">
            {[
              "Consulta cada pregunta en el cuadernillo PDF.",
              "Selecciona la respuesta (A, B, C o D) en esta pantalla.",
              "El simulacro se abrirá en pantalla completa automáticamente.",
              "Si sales, el simulacro se interrumpirá.",
            ].map((t, i) => (
              <p key={i} className="flex items-start gap-2 text-xs text-blue-300">
                <Info className="h-3 w-3 shrink-0 mt-0.5 text-blue-400" />
                {t}
              </p>
            ))}
          </div>

          <button
            onClick={onIniciar}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-lg shadow-blue-600/30"
          >
            <Maximize2 className="h-4 w-4" />
            Iniciar simulacro en pantalla completa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de resultado ──────────────────────────────────────────────────
function PantallaResultado({
  examen,
  resultado,
  tiempoUsado,
}: {
  examen: ExamenInfo;
  resultado: ResultadoFinal;
  tiempoUsado: number;
}) {
  const router = useRouter();
  const nivel = getNivel(resultado.porcentaje);
  const NivelIcon = nivel.icon;
  const preguntas = Object.keys(resultado.detalles)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Header resultado */}
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-sm font-semibold text-green-400">Simulacro completado</p>
          </div>

          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1">{examen.nombre}</h1>
          <p className="text-sm text-[var(--text-muted)]">{examen.materia}</p>

          {/* Puntaje grande */}
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tu puntaje</p>
              <p className="text-5xl font-extrabold text-[var(--text-primary)]">
                {resultado.puntaje}
                <span className="text-2xl text-gray-500 font-semibold"> / {resultado.total}</span>
              </p>
            </div>
            <div className="text-right">
              <p className={cn("text-2xl font-extrabold", nivel.color)}>{resultado.porcentaje}%</p>
              <p className={cn("flex items-center gap-1 justify-end text-sm font-semibold mt-0.5", nivel.color)}>
                <NivelIcon className="h-4 w-4" />
                {nivel.label}
              </p>
            </div>
          </div>

          {/* Barra */}
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", nivel.bg)}
              style={{ width: `${resultado.porcentaje}%` }}
            />
          </div>

          {/* Stats secundarios */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Correctas", value: String(resultado.puntaje), color: "text-green-400" },
              { label: "Incorrectas", value: String(resultado.total - resultado.puntaje), color: "text-red-400" },
              { label: "Tiempo usado", value: formatTiempo(tiempoUsado), color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                <p className={cn("text-xl font-bold", color)}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle de respuestas */}
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">
            Revisión de respuestas
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {preguntas.map((num) => {
              const d = resultado.detalles[String(num)];
              return (
                <div
                  key={num}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
                    d.correcto
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {d.correcto ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Pregunta {num}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {d.dada ? (
                      <span className={cn("font-bold", d.correcto ? "text-green-400" : "text-red-400")}>
                        {d.dada}
                      </span>
                    ) : (
                      <span className="text-gray-600 italic">Sin resp.</span>
                    )}
                    {!d.correcto && (
                      <>
                        <span className="text-gray-600">→</span>
                        <span className="font-bold text-green-400">{d.correcta}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/simulacros")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Home className="h-4 w-4" />
            Volver a Simulacros
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — EL EXAMEN
// ══════════════════════════════════════════════════════════════════════════════
export function SimulacroExamen({ examen }: Props) {
  const router = useRouter();

  // ── Estado ──────────────────────────────────────────────────────────────
  const [fase, setFase] = useState<Fase>("inicio");
  const [preguntaActual, setPreguntaActual] = useState(1);
  const [respuestas, setRespuestas] = useState<Record<number, Respuesta>>({});
  const [tiempoRestante, setTiempoRestante] = useState(examen.tiempoMin * 60);
  const [tiempoUsado, setTiempoUsado] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tiempoInicioRef = useRef<number>(0);

  const totalPreguntas = examen.totalPreguntas;
  const respondidas = Object.keys(respuestas).length;
  const progresoPct = Math.round((respondidas / totalPreguntas) * 100);

  // ── Fullscreen ───────────────────────────────────────────────────────────
  const entrarFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // El usuario puede haber denegado el fullscreen, continuamos de todos modos
    }
  }, []);

  const salirFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch {/* ok */}
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Si salió de fullscreen durante el examen, mostrar advertencia
      if (!document.fullscreenElement && fase === "examen") {
        // No bloqueamos — solo notificamos visualmente
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [fase]);

  // ── Timer ────────────────────────────────────────────────────────────────
  const iniciarTimer = useCallback(() => {
    tiempoInicioRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          // Tiempo agotado — enviar automáticamente
          clearInterval(timerRef.current!);
          handleEnviarAuto();
          return 0;
        }
        setTiempoUsado(Math.floor((Date.now() - tiempoInicioRef.current) / 1000));
        return prev - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detenerTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => detenerTimer();
  }, [detenerTimer]);

  // ── beforeunload — aviso al cerrar tab/refresh ───────────────────────────
  useEffect(() => {
    if (fase !== "examen") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fase]);

  // ── Iniciar examen ───────────────────────────────────────────────────────
  const handleIniciar = async () => {
    await entrarFullscreen();
    setFase("examen");
    iniciarTimer();
  };

  // ── Enviar (manual) ──────────────────────────────────────────────────────
  const handleEnviarConfirmado = async () => {
    setShowEnviarModal(false);
    await enviarRespuestas();
  };

  const handleEnviarAuto = async () => {
    await enviarRespuestas();
  };

  const enviarRespuestas = async () => {
    detenerTimer();
    const usados = Math.floor((Date.now() - tiempoInicioRef.current) / 1000);
    setTiempoUsado(usados);
    setFase("enviando");

    const respObj: Record<string, string> = {};
    for (const [k, v] of Object.entries(respuestas)) {
      respObj[String(k)] = v;
    }

    try {
      const res = await fetch(`/api/dashboard/simulacros/${examen.id}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: respObj, tiempoUsado: usados }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data);
      await salirFullscreen();
      setFase("resultado");
    } catch (err: any) {
      alert(err?.message ?? "Error al enviar. Intenta de nuevo.");
      setFase("examen");
      iniciarTimer();
    }
  };

  // ── Salir del examen ─────────────────────────────────────────────────────
  const handleSalirConfirmado = async () => {
    detenerTimer();
    await salirFullscreen();
    router.push("/dashboard/simulacros");
  };

  // ── Responder pregunta ───────────────────────────────────────────────────
  const handleResponder = (op: Respuesta) => {
    setRespuestas((prev) => ({ ...prev, [preguntaActual]: op }));
  };

  // ── Color del timer ──────────────────────────────────────────────────────
  const timerColor =
    tiempoRestante < 300
      ? "text-red-400"
      : tiempoRestante < 600
      ? "text-amber-400"
      : "text-[var(--text-primary)]";

  // ── Render según fase ────────────────────────────────────────────────────

  if (fase === "inicio") {
    return <PantallaInicio examen={examen} onIniciar={handleIniciar} />;
  }

  if (fase === "enviando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Calificando simulacro…</p>
        </div>
      </div>
    );
  }

  if (fase === "resultado" && resultado) {
    return (
      <PantallaResultado
        examen={examen}
        resultado={resultado}
        tiempoUsado={tiempoUsado}
      />
    );
  }

  // ── FASE: EXAMEN ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">

      {/* ── Modales ── */}
      {showExitModal && (
        <Modal
          titulo="¿Salir del simulacro?"
          mensaje="Si sales ahora perderás tu progreso. Esta acción no se puede deshacer."
          confirmLabel="Sí, salir"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleSalirConfirmado}
          onCancel={() => setShowExitModal(false)}
        />
      )}
      {showEnviarModal && (
        <Modal
          titulo={
            respondidas < totalPreguntas
              ? `Tienes ${totalPreguntas - respondidas} preguntas sin responder`
              : "¿Enviar simulacro?"
          }
          mensaje={
            respondidas < totalPreguntas
              ? "Las preguntas sin responder contarán como incorrectas. ¿Deseas enviar de todos modos?"
              : "Una vez enviado, no podrás modificar tus respuestas."
          }
          confirmLabel="Enviar"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={handleEnviarConfirmado}
          onCancel={() => setShowEnviarModal(false)}
        />
      )}

      {/* ══ PANEL IZQUIERDO — HOJA DE RESPUESTAS ══ */}
      <aside className="flex w-[220px] sm:w-[240px] shrink-0 flex-col border-r border-white/10 bg-[var(--bg-card)] overflow-hidden">

        {/* Header del panel */}
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{examen.nombre}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{examen.materia}</p>
        </div>

        {/* Timer */}
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Tiempo restante</span>
            </div>
            <button
              onClick={async () => {
                if (isFullscreen) {
                  await salirFullscreen();
                } else {
                  await entrarFullscreen();
                }
              }}
              className="text-gray-600 hover:text-[var(--text-primary)] transition"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className={cn("text-2xl font-mono font-extrabold tabular-nums", timerColor)}>
            {formatTiempo(tiempoRestante)}
          </p>
          {/* Barra de tiempo */}
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                tiempoRestante < 300 ? "bg-red-500" : tiempoRestante < 600 ? "bg-amber-500" : "bg-blue-500"
              )}
              style={{
                width: `${(tiempoRestante / (examen.tiempoMin * 60)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Progreso */}
        <div className="border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--text-muted)]">{respondidas} / {totalPreguntas} respondidas</span>
            <span className="font-bold text-[var(--text-primary)]">{progresoPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progresoPct}%` }}
            />
          </div>
        </div>

        {/* Grid de preguntas */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
            Hoja de respuestas
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalPreguntas }, (_, i) => i + 1).map((n) => {
              const resp = respuestas[n];
              const isActual = n === preguntaActual;
              return (
                <button
                  key={n}
                  onClick={() => setPreguntaActual(n)}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-bold transition-all",
                    isActual
                      ? "ring-2 ring-blue-500 bg-blue-600 text-white"
                      : resp
                      ? "bg-blue-500/25 text-blue-300 hover:bg-blue-500/40"
                      : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]"
                  )}
                  title={resp ? `P${n}: ${resp}` : `Pregunta ${n}`}
                >
                  {resp ? resp : n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="border-t border-white/10 px-3 py-2.5 space-y-1.5">
          {[
            { color: "bg-blue-600", label: "Actual" },
            { color: "bg-blue-500/25", label: "Respondida" },
            { color: "bg-white/5", label: "Sin responder" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded shrink-0", color)} />
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ PANEL DERECHO — PREGUNTA ACTUAL ══ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Barra de acciones superior */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[var(--bg-card)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Pregunta {preguntaActual} <span className="text-[var(--text-muted)] font-normal">de {totalPreguntas}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              Enviar
            </button>
          </div>
        </div>

        {/* Contenido de la pregunta — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">

            {/* Número y navegación */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">
                  {preguntaActual}
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {respuestas[preguntaActual]
                      ? `Respondida: ${respuestas[preguntaActual]}`
                      : "Sin responder"}
                  </p>
                </div>
              </div>
              {/* Pestañas Respondida / Sin responder */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {["Respondida", "Sin responder"].map((t) => {
                  const isResp = t === "Respondida";
                  const activo = isResp ? !!respuestas[preguntaActual] : !respuestas[preguntaActual];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        // Ir a la próxima del tipo
                        const questions = Array.from({ length: totalPreguntas }, (_, i) => i + 1);
                        const candidatos = isResp
                          ? questions.filter((n) => !!respuestas[n])
                          : questions.filter((n) => !respuestas[n]);
                        if (candidatos.length > 0) {
                          const next = candidatos.find((n) => n > preguntaActual) ?? candidatos[0];
                          setPreguntaActual(next);
                        }
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition",
                        activo
                          ? "bg-white/10 text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card de la pregunta */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/30 text-xs font-bold text-blue-300">
                  📄
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-200">
                    Consulta la <span className="text-white">pregunta {preguntaActual}</span> en el cuadernillo PDF del simulacro.
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    El cuadernillo fue enviado por tu docente antes de la sesión.
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de respuesta */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-4">Selecciona tu respuesta:</p>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as Respuesta[]).map((op) => {
                  const selected = respuestas[preguntaActual] === op;
                  return (
                    <button
                      key={op}
                      onClick={() => handleResponder(op)}
                      className={cn(
                        "flex items-center justify-center rounded-2xl border py-6 text-2xl font-extrabold transition-all active:scale-[0.97]",
                        selected
                          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : "border-white/10 bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
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

        {/* Navegación inferior */}
        <div className="border-t border-white/10 bg-[var(--bg-card)] px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPreguntaActual((p) => Math.max(1, p - 1))}
              disabled={preguntaActual === 1}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <span className="text-xs text-[var(--text-muted)]">
              {preguntaActual} / {totalPreguntas}
            </span>

            <button
              onClick={() => {
                if (preguntaActual === totalPreguntas) {
                  setShowEnviarModal(true);
                } else {
                  setPreguntaActual((p) => Math.min(totalPreguntas, p + 1));
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                preguntaActual === totalPreguntas
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-white/10 bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"
              )}
            >
              {preguntaActual === totalPreguntas ? (
                <>
                  <Send className="h-4 w-4" />
                  Enviar
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}