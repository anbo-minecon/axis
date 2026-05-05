// components/admin/MaterialesAdminClient.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, FileText, Youtube, ExternalLink, Pencil,
  Trash2, Loader2, AlertTriangle, CheckCircle2,
  X, Eye, EyeOff, GripVertical,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Material {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "PDF" | "VIDEO";
  url: string;
  materia: string | null;
  activo: boolean;
  orden: number;
  createdAt: string;
}

const MATERIAS = [
  "Matemáticas", "Lectura Crítica", "Ciencias Naturales",
  "Sociales y Ciudadanas", "Inglés", "General",
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

// ── Toast interno ──────────────────────────────────────────────────────────
function Toast({ tipo, msg, onClose }: { tipo: "ok" | "error"; msg: string; onClose: () => void }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
      tipo === "ok"
        ? "border-green-500/30 bg-green-500/10 text-green-400"
        : "border-red-500/30 bg-red-500/10 text-red-400"
    )}>
      {tipo === "ok"
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Modal Crear / Editar ───────────────────────────────────────────────────
function MaterialModal({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Material | null;
  onSave: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [titulo,      setTitulo]      = useState(initial?.titulo      ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [tipo,        setTipo]        = useState<"PDF" | "VIDEO">(initial?.tipo ?? "PDF");
  const [url,         setUrl]         = useState(initial?.url         ?? "");
  const [materia,     setMateria]     = useState(initial?.materia     ?? "");
  const [orden,       setOrden]       = useState(initial?.orden       ?? 0);

  const handleSubmit = () => {
    onSave({ titulo, descripcion: descripcion || null, tipo, url, materia: materia || null, orden });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-bold text-white">
            {initial ? "Editar material" : "Agregar material"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Tipo */}
          <div className="flex gap-2">
            {(["PDF", "VIDEO"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition",
                  tipo === t
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {t === "PDF"
                  ? <FileText className="h-4 w-4" />
                  : <Youtube className="h-4 w-4" />}
                {t === "PDF" ? "Documento PDF" : "Video YouTube"}
              </button>
            ))}
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tipo === "PDF" ? "Ej: Guía de Álgebra" : "Ej: Introducción a Funciones"}
              className={inputCls}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              URL del {tipo === "PDF" ? "documento en Drive" : "video en YouTube"} <span className="text-red-400">*</span>
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                tipo === "PDF"
                  ? "https://drive.google.com/file/d/..."
                  : "https://youtube.com/watch?v=..."
              }
              className={inputCls}
            />
            <p className="text-[10px] text-gray-600 mt-1">
              {tipo === "PDF"
                ? "Asegúrate de que el archivo en Drive tenga acceso público de lectura."
                : "Puede ser público o no listado."}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve del contenido..."
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Materia + Orden */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Materia</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="">Sin categoría</option>
                {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value))}
                min={0}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !titulo.trim() || !url.trim()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Guardar cambios" : "Agregar material"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmación eliminar ────────────────────────────────────────────
function DeleteModal({ nombre, onConfirm, onClose, loading }: {
  nombre: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-base font-bold text-white">Eliminar material</h2>
        </div>
        <p className="text-sm text-gray-400">
          ¿Eliminar <span className="text-white font-semibold">"{nombre}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chip de materia ────────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "General":               "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

// ── Componente principal ───────────────────────────────────────────────────
export function MaterialesAdminClient() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving,  setSaving]        = useState(false);
  const [toast,   setToast]         = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);
  const [modal,   setModal]         = useState<"crear" | "editar" | "eliminar" | null>(null);
  const [seleccionado, setSeleccionado] = useState<Material | null>(null);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/material");
      const d = await r.json();
      setMateriales(d.materiales ?? []);
    } catch {
      showToast("error", "No se pudieron cargar los materiales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Crear
  const handleCrear = async (data: any) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) { showToast("error", d.error ?? "Error al crear."); return; }
      showToast("ok", "Material agregado exitosamente.");
      setModal(null);
      cargar();
    } catch {
      showToast("error", "Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  // Editar
  const handleEditar = async (data: any) => {
    if (!seleccionado) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/material/${seleccionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) { showToast("error", d.error ?? "Error al editar."); return; }
      showToast("ok", "Material actualizado.");
      setModal(null);
      setSeleccionado(null);
      cargar();
    } catch {
      showToast("error", "Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle activo
  const handleToggleActivo = async (m: Material) => {
    try {
      await fetch(`/api/admin/material/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !m.activo }),
      });
      cargar();
    } catch {
      showToast("error", "Error al cambiar el estado.");
    }
  };

  // Eliminar
  const handleEliminar = async () => {
    if (!seleccionado) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/material/${seleccionado.id}`, { method: "DELETE" });
      if (!r.ok) { showToast("error", "Error al eliminar."); return; }
      showToast("ok", "Material eliminado.");
      setModal(null);
      setSeleccionado(null);
      cargar();
    } catch {
      showToast("error", "Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  const activos   = materiales.filter((m) => m.activo).length;
  const inactivos = materiales.filter((m) => !m.activo).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">

      {/* Modales */}
      {modal === "crear" && (
        <MaterialModal onSave={handleCrear} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal === "editar" && seleccionado && (
        <MaterialModal
          initial={seleccionado}
          onSave={handleEditar}
          onClose={() => { setModal(null); setSeleccionado(null); }}
          loading={saving}
        />
      )}
      {modal === "eliminar" && seleccionado && (
        <DeleteModal
          nombre={seleccionado.titulo}
          onConfirm={handleEliminar}
          onClose={() => { setModal(null); setSeleccionado(null); }}
          loading={saving}
        />
      )}

      {/* Toast */}
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-white">Material de Estudio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos} activo{activos !== 1 ? "s" : ""}
            {inactivos > 0 && ` · ${inactivos} oculto${inactivos !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setModal("crear")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Agregar material
        </button>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : materiales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-white/10">
          <FileText className="h-12 w-12 text-gray-700" />
          <div>
            <p className="text-sm font-semibold text-gray-500">Sin materiales aún</p>
            <p className="text-xs text-gray-600 mt-1">Agrega el primer recurso para los estudiantes.</p>
          </div>
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Agregar material
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {materiales.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition",
                m.activo
                  ? "border-white/10 bg-[var(--bg-card)] hover:border-white/20"
                  : "border-white/5 bg-white/[0.02] opacity-60"
              )}
            >
              {/* Drag handle visual */}
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />

              {/* Ícono tipo */}
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                m.tipo === "PDF" ? "bg-blue-500/20" : "bg-red-500/20"
              )}>
                {m.tipo === "PDF"
                  ? <FileText className="h-4 w-4 text-blue-400" />
                  : <Youtube className="h-4 w-4 text-red-400" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white truncate">{m.titulo}</p>
                  {m.materia && (
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0", getMateriaColor(m.materia))}>
                      {m.materia}
                    </span>
                  )}
                </div>
                {m.descripcion && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{m.descripcion}</p>
                )}
                <p className="text-[10px] text-gray-700 mt-0.5 truncate">{m.url}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                  title="Abrir URL"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleToggleActivo(m)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition",
                    m.activo
                      ? "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10"
                      : "text-gray-600 hover:text-green-400 hover:bg-green-500/10"
                  )}
                  title={m.activo ? "Ocultar" : "Mostrar"}
                >
                  {m.activo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { setSeleccionado(m); setModal("editar"); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setSeleccionado(m); setModal("eliminar"); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}