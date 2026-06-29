// components/admin/SimulacrosClient.tsx
"use client";

import { useRef, useState } from "react";
import {
  User, Layers, Plus, Trash2, ChevronDown, ChevronUp,
  Clock, Upload, Download, CheckCircle2, AlertTriangle,
  X, Loader2, FileUp, ClipboardList, FileSpreadsheet,
  Calendar, Info, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────
type TipoSimulacro  = "individual" | "grupal";
type RespuestaLetra = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
type Dificultad     = "facil" | "media" | "dificil";
type Tab            = "crear" | "importar";

const DIFICULTAD_MULTIPLICADOR: Record<Dificultad, number> = {
  facil:   1,
  media:   1.5,
  dificil: 2,
};

const MATERIAS_DISPONIBLES = [
  "Lectura Crítica",
  "Matemáticas",
  "Ciencias Naturales",
  "Sociales y Ciudadanas",
  "Inglés",
];

interface ClaveRespuesta {
  numero: number;
  respuesta: RespuestaLetra | null;
  dificultad: Dificultad;
}

interface BloqueMateria {
  id: string;
  materia: string;
  cantidad: number;
  inicio: number; // primer número de pregunta en este bloque
}

interface SesionConfig {
  id: string;
  numero: number;
  bloques: BloqueMateria[];
  tiempoMin: number;
  claves: ClaveRespuesta[];
  expandida: boolean;
  clavesExpandidas: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition";

const DIFICULTAD_LABEL: Record<Dificultad, string> = {
  facil:   "Fácil ×1",
  media:   "Media ×1.5",
  dificil: "Difícil ×2",
};

const DIFICULTAD_COLOR: Record<Dificultad, string> = {
  facil:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  media:   "bg-amber-500/20 text-amber-400 border-amber-500/40",
  dificil: "bg-red-500/20 text-red-400 border-red-500/40",
};

function makeClaves(inicio: number, cantidad: number): ClaveRespuesta[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: inicio + i,
    respuesta: null,
    dificultad: "media" as Dificultad,
  }));
}

function recalcularInicio(bloques: BloqueMateria[], idx: number, base: number): number {
  let acc = base;
  for (let i = 0; i < idx; i++) acc += bloques[i].cantidad;
  return acc;
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ tipo, msg, onClose }: { tipo: "ok" | "error"; msg: string; onClose: () => void }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
      tipo === "ok"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-red-500/30 bg-red-500/10 text-red-400",
    )}>
      {tipo === "ok"
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CREAR SIMULACRO
// ══════════════════════════════════════════════════════════════════════════
function CrearSimulacroForm() {
  const [tipo,       setTipo]       = useState<TipoSimulacro | null>(null);
  const [nombre,     setNombre]     = useState("");
  const [materia,    setMateria]    = useState("");           // solo para individual
  const [tiempoMin,  setTiempoMin]  = useState(90);          // solo para individual
  const [fechaLimite,setFechaLimite]= useState("");

  // Estado sesiones (grupal)
  const [sesiones,   setSesiones]   = useState<SesionConfig[]>([]);

  // UI
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Totales ──────────────────────────────────────────────────────────────
  const totalPreguntas = tipo === "individual"
    ? 10  // placeholder; el admin define la clave manual
    : sesiones.reduce((a, s) => a + s.bloques.reduce((b, bl) => b + bl.cantidad, 0), 0);

  const totalTiempo = tipo === "individual"
    ? tiempoMin
    : sesiones.reduce((a, s) => a + s.tiempoMin, 0);

  const totalSesiones = tipo === "grupal" ? sesiones.length : 1;

  // ── Claves individuales (para simulacro individual) ───────────────────
  const [clavesInd, setClavesInd] = useState<ClaveRespuesta[]>(makeClaves(1, 10));

  const respDefInd = clavesInd.filter((c) => c.respuesta !== null).length;

  const toggleRespInd = (num: number, op: RespuestaLetra) =>
    setClavesInd((prev) => prev.map((c) =>
      c.numero === num ? { ...c, respuesta: c.respuesta === op ? null : op } : c));

  const setDifInd = (num: number, d: Dificultad) =>
    setClavesInd((prev) => prev.map((c) => c.numero === num ? { ...c, dificultad: d } : c));

  const agregarClavesInd = (n: number) => {
    const desde = clavesInd.length + 1;
    setClavesInd((prev) => [...prev, ...makeClaves(desde, n)]);
  };

  // ── Sesiones (grupal) ────────────────────────────────────────────────
  const agregarSesion = () => {
    const num = sesiones.length + 1;
    const nuevaSesion: SesionConfig = {
      id: uid(),
      numero: num,
      tiempoMin: 135,
      bloques: [],
      claves: [],
      expandida: true,
      clavesExpandidas: false,
    };
    setSesiones((prev) => [...prev, nuevaSesion]);
  };

  const eliminarSesion = (id: string) =>
    setSesiones((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, numero: i + 1 })));

  const toggleSesion = (id: string, campo: "expandida" | "clavesExpandidas") =>
    setSesiones((prev) => prev.map((s) => s.id === id ? { ...s, [campo]: !s[campo] } : s));

  const setTiempoSesion = (id: string, t: number) =>
    setSesiones((prev) => prev.map((s) => s.id === id ? { ...s, tiempoMin: t } : s));

  // Bloques de materia
  const agregarBloque = (sesionId: string) => {
    setSesiones((prev) => prev.map((s) => {
      if (s.id !== sesionId) return s;
      const base = s.bloques.length > 0
        ? s.bloques[s.bloques.length - 1].inicio + s.bloques[s.bloques.length - 1].cantidad
        : 1;
      const nuevo: BloqueMateria = { id: uid(), materia: "", cantidad: 10, inicio: base };
      const nuevosBloques = [...s.bloques, nuevo];
      const nuevasClaves  = [...s.claves, ...makeClaves(base, 10)];
      return { ...s, bloques: nuevosBloques, claves: nuevasClaves };
    }));
  };

  const eliminarBloque = (sesionId: string, bloqueId: string) => {
    setSesiones((prev) => prev.map((s) => {
      if (s.id !== sesionId) return s;
      const idx = s.bloques.findIndex((b) => b.id === bloqueId);
      if (idx === -1) return s;
      const eliminado = s.bloques[idx];
      const newBloques = s.bloques.filter((b) => b.id !== bloqueId).map((b, i) => ({
        ...b,
        inicio: recalcularInicio(s.bloques.filter((bb) => bb.id !== bloqueId), i, 1),
      }));
      const numsBorrados = new Set(
        Array.from({ length: eliminado.cantidad }, (_, i) => eliminado.inicio + i)
      );
      const newClaves = s.claves
        .filter((c) => !numsBorrados.has(c.numero))
        .map((c) => {
          // renumerar claves que venían después
          const offset = c.numero > eliminado.inicio ? -eliminado.cantidad : 0;
          return { ...c, numero: c.numero + offset };
        });
      return { ...s, bloques: newBloques, claves: newClaves };
    }));
  };

  const setBloqueMateria = (sesionId: string, bloqueId: string, mat: string) =>
    setSesiones((prev) => prev.map((s) =>
      s.id !== sesionId ? s : {
        ...s,
        bloques: s.bloques.map((b) => b.id === bloqueId ? { ...b, materia: mat } : b),
      }));

  const setBloqueCantidad = (sesionId: string, bloqueId: string, qty: number) => {
    setSesiones((prev) => prev.map((s) => {
      if (s.id !== sesionId) return s;
      const idx = s.bloques.findIndex((b) => b.id === bloqueId);
      if (idx === -1) return s;
      const viejo = s.bloques[idx];
      const diff  = qty - viejo.cantidad;

      const newBloques = s.bloques.map((b, i) => {
        if (b.id === bloqueId) return { ...b, cantidad: Math.max(1, qty) };
        if (i > idx) return { ...b, inicio: b.inicio + diff };
        return b;
      });

      let newClaves = [...s.claves];
      if (diff > 0) {
        // agregar claves al final del bloque
        const desde = viejo.inicio + viejo.cantidad;
        const extras = makeClaves(desde, diff);
        newClaves = [
          ...newClaves.filter((c) => c.numero < desde),
          ...extras,
          ...newClaves.filter((c) => c.numero >= desde).map((c) => ({ ...c, numero: c.numero + diff })),
        ];
      } else if (diff < 0) {
        const eliminar = new Set(
          Array.from({ length: Math.abs(diff) }, (_, i) => viejo.inicio + viejo.cantidad + diff + i)
        );
        newClaves = newClaves
          .filter((c) => !eliminar.has(c.numero))
          .map((c) => (c.numero > viejo.inicio + viejo.cantidad ? { ...c, numero: c.numero + diff } : c));
      }
      return { ...s, bloques: newBloques, claves: newClaves };
    }));
  };

  // Respuestas en sesiones grupales
  const toggleRespGrupal = (sesionId: string, num: number, op: RespuestaLetra) =>
    setSesiones((prev) => prev.map((s) =>
      s.id !== sesionId ? s : {
        ...s,
        claves: s.claves.map((c) =>
          c.numero === num ? { ...c, respuesta: c.respuesta === op ? null : op } : c),
      }));

  const setDifGrupal = (sesionId: string, num: number, d: Dificultad) =>
    setSesiones((prev) => prev.map((s) =>
      s.id !== sesionId ? s : {
        ...s,
        claves: s.claves.map((c) => c.numero === num ? { ...c, dificultad: d } : c),
      }));

  // ── Guardar ───────────────────────────────────────────────────────────
  const handleGuardar = async (estado: "BORRADOR" | "PUBLICADO") => {
    if (!nombre.trim()) return showToast("error", "El nombre del simulacro es obligatorio.");
    if (!tipo)          return showToast("error", "Selecciona el tipo de simulacro.");

    if (tipo === "individual") {
      if (!materia)         return showToast("error", "Selecciona una materia.");
      if (respDefInd === 0) return showToast("error", "Define al menos una respuesta correcta.");
    }

    if (tipo === "grupal") {
      if (!fechaLimite)          return showToast("error", "La fecha y hora límite es obligatoria.");
      if (sesiones.length === 0) return showToast("error", "Agrega al menos una sesión.");
      for (const s of sesiones) {
        if (s.bloques.length === 0)
          return showToast("error", `La sesión ${s.numero} no tiene materias.`);
        if (s.bloques.some((b) => !b.materia))
          return showToast("error", `Selecciona la materia en todos los bloques de la sesión ${s.numero}.`);
      }
      const totalClavesGrupal = sesiones.flatMap((s) => s.claves).filter((c) => c.respuesta !== null).length;
      if (totalClavesGrupal === 0)
        return showToast("error", "Define al menos una respuesta correcta en la clave de respuestas.");
    }

    setLoading(true);
    try {
      // Convertir "2026-05-16T14:30" → "2026-05-16T14:30:00.000Z" para el backend
      const normalizarFecha = (f: string): string | null => {
        if (!f) return null;
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(f)
          ? `${f}:00.000Z`
          : f;
      };

      // totalPreguntas: cuenta real de claves definidas + sin definir del form
      const totalPreguntasReal = tipo === "individual"
        ? clavesInd.length
        : sesiones.reduce((a, s) => a + s.bloques.reduce((b, bl) => b + bl.cantidad, 0), 0);

      const body: any = {
        nombre,
        estado,
        tieneSesiones:  tipo === "grupal",
        tiempoMin:      tipo === "individual" ? tiempoMin : totalTiempo,
        totalPreguntas: totalPreguntasReal,
        fechaDisponible: null,
        fechaCierre:    normalizarFecha(fechaLimite),
      };

      if (tipo === "individual") {
        body.materia = materia;
        // Incluir TODAS las claves con respuesta definida, incluyendo dificultad
        body.claves = clavesInd
          .filter((c) => c.respuesta !== null)
          .map((c) => ({
            numero:     c.numero,
            respuesta:  c.respuesta,
            sesion:     1,
            dificultad: c.dificultad,
          }));
      } else {
        body.materia = "Multi-materia";
        body.sesiones = sesiones.map((s) => ({
          numero:    s.numero,
          nombre:    `Sesión ${s.numero}`,
          tiempoMin: s.tiempoMin,
        }));
        body.claves = sesiones.flatMap((s) =>
          s.claves
            .filter((c) => c.respuesta !== null)
            .map((c) => ({
              numero:     c.numero,
              respuesta:  c.respuesta,
              sesion:     s.numero,
              dificultad: c.dificultad,
            }))
        );
      }

      const res  = await fetch("/api/admin/simulacros", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        // Mostrar el primer error + detalle si existe
        const msg = data.error ?? "Error al guardar.";
        const det = data.detalles ? ` (${data.detalles[0]})` : "";
        showToast("error", msg + det);
        return;
      }

      showToast("ok", estado === "PUBLICADO" ? "Simulacro publicado con éxito." : "Guardado como borrador.");
      // Reset completo
      setNombre(""); setMateria(""); setTiempoMin(90); setFechaLimite("");
      setSesiones([]); setTipo(null); setClavesInd(makeClaves(1, 10));
    } catch (err) {
      console.error("[handleGuardar]", err);
      showToast("error", "Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {/* Selector de tipo */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Tipo de simulacro</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configura el tipo de evaluación, la estructura y la clave de respuestas con su dificultad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Individual */}
          <button
            onClick={() => setTipo("individual")}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
              tipo === "individual"
                ? "border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/40"
                : "border-white/10 bg-white/[0.03] hover:border-white/20",
            )}
          >
            <div className="flex items-center gap-2">
              {tipo === "individual" && (
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  Seleccionado
                </span>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <User className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Simulacro Individual</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Una materia · Semanal · Ranking entre estudiantes</p>
            </div>
          </button>

          {/* Grupal */}
          <button
            onClick={() => setTipo("grupal")}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
              tipo === "grupal"
                ? "border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/40"
                : "border-white/10 bg-white/[0.03] hover:border-white/20",
            )}
          >
            <div className="flex items-center gap-2">
              {tipo === "grupal" && (
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  Seleccionado
                </span>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Layers className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Simulacro Grupal</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Multi-materia · Sesiones · Fecha límite configurable</p>
            </div>
          </button>
        </div>

        {/* Placeholder si no hay tipo */}
        {!tipo && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layers className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">Selecciona el tipo de simulacro para continuar con la configuración.</p>
          </div>
        )}
      </div>

      {/* ── Formulario Individual ── */}
      {tipo === "individual" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Información general</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Nombre del simulacro <span className="text-red-400">*</span>
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Simulacro Semanal #12"
                  className={inputCls}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Materia <span className="text-red-400">*</span>
                </label>
                <select
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  className={cn(inputCls, "cursor-pointer")}
                  disabled={loading}
                >
                  <option value="">Seleccionar materia</option>
                  {MATERIAS_DISPONIBLES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Tiempo límite (minutos)
                </label>
                <input
                  type="number"
                  value={tiempoMin}
                  onChange={(e) => setTiempoMin(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className={inputCls}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                Este simulacro tendrá <strong>periodicidad semanal</strong>. Los estudiantes podrán
                comparar su puntaje con el de sus compañeros en el ranking.
              </p>
            </div>
          </div>

          {/* Clave de respuestas individual */}
          <ClavesRespuestasPanel
            claves={clavesInd}
            titulo="Clave de respuestas"
            onToggleRespuesta={toggleRespInd}
            onSetDificultad={setDifInd}
            onAgregarMas={agregarClavesInd}
            loading={loading}
          />
        </>
      )}

      {/* ── Formulario Grupal ── */}
      {tipo === "grupal" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Información general</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Nombre del simulacro <span className="text-red-400">*</span>
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Simulacro Integral #3"
                  className={inputCls}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Fecha y hora límite <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className={inputCls}
                  disabled={loading}
                />
                <p className="text-[10px] text-gray-600 mt-1">El acceso se bloqueará automáticamente en esta fecha.</p>
              </div>
            </div>

            {/* Resumen */}
            {(sesiones.length > 0 || totalPreguntas > 0) && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-300 font-semibold">
                {totalSesiones} sesión{totalSesiones !== 1 ? "es" : ""} ·{" "}
                {totalPreguntas} preguntas totales ·{" "}
                {totalTiempo} min totales
              </div>
            )}
          </div>

          {/* Sesiones y bloques */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Sesiones y bloques de materias</h2>
              <button
                onClick={agregarSesion}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 transition disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />Agregar sesión
              </button>
            </div>

            {sesiones.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-6">
                Agrega la primera sesión para comenzar a estructurar el simulacro.
              </p>
            )}

            <div className="space-y-3">
              {sesiones.map((sesion) => {
                const totalSesion = sesion.bloques.reduce((a, b) => a + b.cantidad, 0);
                const defSesion   = sesion.claves.filter((c) => c.respuesta !== null).length;

                return (
                  <div key={sesion.id} className="rounded-2xl border border-white/10 bg-[var(--bg-secondary)] overflow-hidden">
                    {/* Header sesión */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-xs font-extrabold text-white">
                        {sesion.numero}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">Sesión {sesion.numero}</p>
                        <p className="text-[10px] text-gray-500">
                          {sesion.bloques.length} materia{sesion.bloques.length !== 1 ? "s" : ""} · {totalSesion} preguntas
                        </p>
                      </div>
                      {/* Tiempo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        <input
                          type="number"
                          value={sesion.tiempoMin}
                          onChange={(e) => setTiempoSesion(sesion.id, Math.max(1, Number(e.target.value)))}
                          min={1}
                          className="w-16 rounded-lg border border-white/10 bg-[var(--bg-card)] px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        <span className="text-xs text-gray-500">min</span>
                      </div>
                      {/* Eliminar */}
                      <button
                        onClick={() => eliminarSesion(sesion.id)}
                        className="text-gray-600 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {/* Expand */}
                      <button
                        onClick={() => toggleSesion(sesion.id, "expandida")}
                        className="text-gray-600 hover:text-white transition"
                      >
                        {sesion.expandida
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Cuerpo sesión */}
                    {sesion.expandida && (
                      <div className="border-t border-white/10 px-4 py-4 space-y-3">
                        {/* Bloques de materia */}
                        {sesion.bloques.map((bloque, bi) => {
                          const fin = bloque.inicio + bloque.cantidad - 1;
                          return (
                            <div key={bloque.id} className="flex items-center gap-2">
                              <select
                                value={bloque.materia}
                                onChange={(e) => setBloqueMateria(sesion.id, bloque.id, e.target.value)}
                                className="flex-1 rounded-xl border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                              >
                                <option value="">Seleccionar materia</option>
                                {MATERIAS_DISPONIBLES.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                              {/* Cantidad */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-gray-500">Preguntas:</span>
                                <button
                                  onClick={() => setBloqueCantidad(sesion.id, bloque.id, Math.max(1, bloque.cantidad - 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition text-sm font-bold"
                                >−</button>
                                <span className="w-8 text-center text-sm font-bold text-white">{bloque.cantidad}</span>
                                <button
                                  onClick={() => setBloqueCantidad(sesion.id, bloque.id, bloque.cantidad + 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition text-sm font-bold"
                                >+</button>
                              </div>
                              {/* Rango */}
                              <span className="text-[10px] text-gray-600 shrink-0 hidden sm:block">
                                P{bloque.inicio}–P{fin}
                              </span>
                              {/* Eliminar bloque */}
                              <button
                                onClick={() => eliminarBloque(sesion.id, bloque.id)}
                                className="text-gray-600 hover:text-red-400 transition shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Agregar materia */}
                        <button
                          onClick={() => agregarBloque(sesion.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs text-gray-500 hover:border-violet-500/40 hover:text-violet-400 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />Agregar materia a esta sesión
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clave de respuestas grupal – por sesión */}
          {sesiones.some((s) => s.bloques.length > 0) && (
            <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Clave de respuestas</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sesiones.reduce((a, s) => a + s.claves.filter((c) => c.respuesta !== null).length, 0)} de{" "}
                  {totalPreguntas} respuestas definidas
                </p>
              </div>

              {sesiones.map((sesion) => {
                const defSesion = sesion.claves.filter((c) => c.respuesta !== null).length;
                const totalSesion = sesion.bloques.reduce((a, b) => a + b.cantidad, 0);

                return (
                  <div key={sesion.id} className="rounded-2xl border border-white/10 bg-[var(--bg-secondary)] overflow-hidden">
                    {/* Header acordeón */}
                    <button
                      className="flex w-full items-center justify-between px-4 py-3"
                      onClick={() => toggleSesion(sesion.id, "clavesExpandidas")}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-extrabold text-white">
                          {sesion.numero}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          Sesión {sesion.numero} ({totalSesion} pregs.)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{defSesion}/{totalSesion}</span>
                        {sesion.clavesExpandidas
                          ? <ChevronUp className="h-4 w-4 text-gray-500" />
                          : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </button>

                    {/* Bloques de preguntas agrupadas por materia */}
                    {sesion.clavesExpandidas && sesion.bloques.map((bloque) => {
                      const clavesBloque = sesion.claves.filter(
                        (c) => c.numero >= bloque.inicio && c.numero < bloque.inicio + bloque.cantidad
                      );
                      return (
                        <div key={bloque.id} className="border-t border-white/10 px-4 py-4 space-y-3">
                          <p className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                            {bloque.materia || "Sin materia"} (P{bloque.inicio}–P{bloque.inicio + bloque.cantidad - 1})
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {clavesBloque.map(({ numero, respuesta, dificultad }) => (
                              <ClavePreguntaCard
                                key={numero}
                                numero={numero}
                                respuesta={respuesta}
                                dificultad={dificultad}
                                onToggleRespuesta={(op) => toggleRespGrupal(sesion.id, numero, op)}
                                onSetDificultad={(d)  => setDifGrupal(sesion.id, numero, d)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Acciones finales ── */}
      {tipo && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGuardar("BORRADOR")}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar borrador
          </button>
          <button
            onClick={() => handleGuardar("PUBLICADO")}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Publicar simulacro
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente clave individual ────────────────────────────────────────────
function ClavePreguntaCard({
  numero, respuesta, dificultad,
  onToggleRespuesta, onSetDificultad,
}: {
  numero: number;
  respuesta: RespuestaLetra | null;
  dificultad: Dificultad;
  onToggleRespuesta: (op: RespuestaLetra) => void;
  onSetDificultad:   (d: Dificultad)   => void;
}) {
  const [difOpen, setDifOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-2.5 space-y-2">
      {/* Número + dificultad */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-gray-300">P{numero}</span>
        <div className="relative">
          <button
            onClick={() => setDifOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition",
              DIFICULTAD_COLOR[dificultad],
            )}
          >
            {DIFICULTAD_LABEL[dificultad]}
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {difOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden">
              {(["facil", "media", "dificil"] as Dificultad[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { onSetDificultad(d); setDifOpen(false); }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-[10px] font-bold whitespace-nowrap",
                    DIFICULTAD_COLOR[d],
                    "hover:opacity-80 transition",
                  )}
                >
                  {DIFICULTAD_LABEL[d]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Opciones A-H */}
      <div className="grid grid-cols-2 gap-1">
        {(["A", "B", "C", "D", "E", "F", "G", "H"] as RespuestaLetra[]).map((op) => (
          <button
            key={op}
            onClick={() => onToggleRespuesta(op)}
            className={cn(
              "rounded-lg py-1.5 text-xs font-bold transition-all",
              respuesta === op
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white",
            )}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Panel de claves para simulacro individual ─────────────────────────────
function ClavesRespuestasPanel({
  claves, titulo, onToggleRespuesta, onSetDificultad, onAgregarMas, loading,
}: {
  claves: ClaveRespuesta[];
  titulo: string;
  onToggleRespuesta: (num: number, op: RespuestaLetra) => void;
  onSetDificultad:   (num: number, d: Dificultad)   => void;
  onAgregarMas:      (n: number) => void;
  loading: boolean;
}) {
  const defTotal = claves.filter((c) => c.respuesta !== null).length;
  const facil    = claves.filter((c) => c.dificultad === "facil").length;
  const media    = claves.filter((c) => c.dificultad === "media").length;
  const dificil  = claves.filter((c) => c.dificultad === "dificil").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white">{titulo}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{defTotal} de {claves.length} definidas</p>
        </div>
        {/* Contadores dificultad */}
        <div className="flex items-center gap-2 flex-wrap">
          {([["facil", facil], ["media", media], ["dificil", dificil]] as [Dificultad, number][]).map(([d, n]) => (
            <span key={d} className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold", DIFICULTAD_COLOR[d])}>
              {DIFICULTAD_LABEL[d]} ({n})
            </span>
          ))}
        </div>
      </div>

      {/* Barra progreso */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${claves.length > 0 ? (defTotal / claves.length) * 100 : 0}%` }}
        />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {claves.map(({ numero, respuesta, dificultad }) => (
          <ClavePreguntaCard
            key={numero}
            numero={numero}
            respuesta={respuesta}
            dificultad={dificultad}
            onToggleRespuesta={(op) => onToggleRespuesta(numero, op)}
            onSetDificultad={(d)   => onSetDificultad(numero, d)}
          />
        ))}
      </div>

      {/* Agregar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[5, 10, 25].map((n) => (
          <button
            key={n}
            onClick={() => onAgregarMas(n)}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            + {n} más
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// IMPORTAR EXCEL
// ══════════════════════════════════════════════════════════════════════════
function ImportarExcelForm() {
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ importados: number; errores: number; mensajes: string[] } | null>(null);
  const [error,   setError]   = useState("");
  const inputRef              = useRef<HTMLInputElement>(null!);

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { setError("Solo .xlsx o .xls"); return; }
    setFile(f); setError(""); setResult(null);
  };

  const descargarPlantilla = () => {
    const csv = [
      "simulacro,materia,pregunta,respuesta_correcta,area,sesion,dificultad",
      "1,matemáticas,1,B,MATEMATICAS,1,media",
      "1,matemáticas,2,D,MATEMATICAS,1,facil",
      "1,matemáticas,3,A,MATEMATICAS,2,dificil",
      "2,lectura critica,1,C,LECTURA CRITICA,1,media",
      "2,lectura critica,2,A,LECTURA CRITICA,1,facil",
      "2,lectura critica,3,D,LECTURA CRITICA,2,dificil",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a   = document.createElement("a"); a.href = url; a.download = "plantilla_simulacros.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportar = async () => {
    if (!file) { setError("Selecciona un archivo."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await fetch("/api/admin/simulacros/importar", { method: "POST", body: fd });
      const d  = await r.json();
      if (!r.ok) { setError(d.error ?? "Error."); return; }
      setResult(d); setFile(null);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Formato requerido */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Formato requerido del archivo</h2>
          <p className="text-xs text-gray-500 mt-1">El archivo Excel debe contener estas columnas. La columna <code className="rounded bg-white/10 px-1 text-violet-300">area</code> es necesaria para el modelo ICFES; sesion y dificultad son opcionales, por defecto 1 y media respectivamente.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["simulacro", "materia", "pregunta", "respuesta_correcta", "area", "sesion", "dificultad"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-violet-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["1", "matemáticas", "1", "B", "MATEMATICAS", "1", "media"],
                ["1", "matemáticas", "2", "D", "MATEMATICAS", "1", "facil"],
                ["1", "matemáticas", "3", "A", "MATEMATICAS", "2", "dificil"],
                ["2", "lectura", "1", "C", "LECTURA CRITICA", "1", "media"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} className={cn("px-3 py-2 text-xs",
                      j === 3 ? "font-bold text-violet-400"
                      : j === 4 ? "font-bold text-cyan-300"
                      : j === 5 ? cn("font-bold", c === "1" ? "text-blue-400" : "text-cyan-400")
                      : j === 6 ? cn("font-bold", c === "facil" ? "text-emerald-400" : c === "media" ? "text-amber-400" : "text-red-400")
                      : "text-gray-300"
                    )}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={descargarPlantilla}
          className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition"
        >
          <Download className="h-3.5 w-3.5" />Descargar plantilla Excel
        </button>
      </div>

      {/* Información de sesiones */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Sesiones (opcional)</h2>
        </div>
        <p className="text-xs text-blue-300">
          El campo <code className="rounded bg-white/10 px-1 text-blue-300">sesion</code> es <strong>opcional</strong>.
          Si no se especifica, todas las preguntas se asignan a sesión 1.
        </p>
        <div className="space-y-2 text-xs text-blue-200">
          <p><strong>Sesión única (por defecto):</strong> No incluyas la columna "sesion" o usa siempre "1".</p>
          <p><strong>Simulacro de 2 sesiones:</strong> Incluye preguntas con sesion=1 y sesion=2. El sistema detectará automáticamente que es un simulacro de 2 sesiones.</p>
          <p className="text-blue-100 italic">Ejemplo: preguntas 1–10 en sesion 1, preguntas 11–20 en sesion 2.</p>
        </div>
      </div>

      {/* Ponderación */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Dificultad (opcional)</h2>
        </div>
        <p className="text-xs text-gray-500">
          El campo <code className="rounded bg-white/10 px-1 text-violet-300">dificultad</code> es <strong>opcional</strong> (por defecto "media").
          Determina el peso de cada pregunta. Los valores válidos son:
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {(["facil", "media", "dificil"] as Dificultad[]).map((d) => (
            <div key={d} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", DIFICULTAD_COLOR[d])}>
              <span className="text-xs font-extrabold">{d}</span>
              <span className="text-xs">×{DIFICULTAD_MULTIPLICADOR[d]}</span>
              <span className="text-[10px] text-gray-400">
                {d === "facil" ? "Preguntas de nivel básico"
                  : d === "media" ? "Preguntas de nivel intermedio"
                  : "Preguntas de alta complejidad"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Si el campo <code className="rounded bg-white/10 px-1 text-violet-300">dificultad</code> se omite,
          el sistema asigna <strong className="text-amber-400">media</strong> por defecto.
        </p>
      </div>

      {/* Validaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { color: "border-green-500/20 bg-green-500/5", icon: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />, text: "Los nombres de columna deben ser exactamente como se indica (minúsculas)." },
          { color: "border-green-500/20 bg-green-500/5", icon: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />, text: "Respuestas válidas: A, B, C, D, E, F, G u H (mayúsculas). Dificultad: facil, media o dificil." },
          { color: "border-amber-500/20 bg-amber-500/5", icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />, text: "Filas con errores en respuesta o dificultad serán rechazadas." },
        ].map((item, i) => (
          <div key={i} className={cn("flex items-start gap-2 rounded-xl border p-3", item.color)}>
            {item.icon}
            <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed cursor-pointer transition-all py-14 flex flex-col items-center justify-center gap-3",
          file
            ? "border-green-500/50 bg-green-500/5"
            : "border-white/10 bg-[var(--bg-card)] hover:border-violet-500/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
        {file ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <p className="text-sm font-semibold text-green-400">{file.name}</p>
          </>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-gray-600" />
            <p className="text-sm font-semibold text-white">Arrastra tu archivo aquí</p>
            <span className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
              <Upload className="h-4 w-4" />Seleccionar archivo Excel
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {result && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4">
          <p className="text-sm font-semibold text-green-400">{result.importados} simulacros importados</p>
          {result.errores > 0 && (
            <p className="text-xs text-amber-400 mt-1">{result.errores} filas con errores</p>
          )}
          {result.mensajes?.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {result.mensajes.slice(0, 10).map((m, i) => (
                <li key={i} className="text-[10px] text-amber-500">{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 text-xs text-gray-400">
        <div className="mb-2 font-semibold text-white">Áreas válidas</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            "LECTURA CRITICA",
            "MATEMATICAS",
            "CIENCIAS NATURALES",
            "SOCIALES Y CIUDADANAS",
            "INGLES",
          ].map((area) => (
            <span key={area} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-gray-200">
              {area}
            </span>
          ))}
        </div>
      </div>

      {file && (
        <div className="flex gap-3">
          <button
            onClick={() => { setFile(null); setError(""); }}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleImportar}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Importando…" : "Importar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — 3 tabs: Crear | Gestionar | Importar
// ══════════════════════════════════════════════════════════════════════════
import { SimulacrosAdminList } from "@/components/admin/SimulacrosAdminList";

type TabPrincipal = "crear" | "gestionar" | "importar";

export function SimulacrosClient() {
  const [tab, setTab] = useState<TabPrincipal>("crear");

  const tabs: { id: TabPrincipal; label: string; icon: React.ElementType; desc: string }[] = [
    {
      id:    "crear",
      label: "Crear",
      icon:  ClipboardList,
      desc:  "Configura el tipo de simulacro, la estructura y la clave de respuestas con su dificultad.",
    },
    {
      id:    "gestionar",
      label: "Gestionar",
      icon:  Layers,
      desc:  "Publica, cierra, archiva o elimina simulacros existentes.",
    },
    {
      id:    "importar",
      label: "Importar Excel",
      icon:  FileSpreadsheet,
      desc:  "Carga respuestas correctas en masa mediante un archivo Excel estructurado.",
    },
  ];
  const active = tabs.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">{active.label}</h1>
        <p className="text-sm text-gray-500 mt-1">{active.desc}</p>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              tab === id
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "crear"     && <CrearSimulacroForm />}
      {tab === "gestionar" && <SimulacrosAdminList />}
      {tab === "importar"  && <ImportarExcelForm />}
    </div>
  );
}