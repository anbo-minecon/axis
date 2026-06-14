// components/docente/MaterialDocenteClient.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, Plus, Trash2, Pencil, Eye, EyeOff,
  FileText, Video, Search, RefreshCw, Loader2,
  AlertTriangle, CheckCircle2, X, Save, ExternalLink,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────
type TipoMaterial = "PDF" | "VIDEO";

interface Material {
  id:          string;
  titulo:      string;
  descripcion: string | null;
  tipo:        TipoMaterial;
  url:         string;
  materia:     string | null;
  orden:       number;
  gratis:      boolean;
  activo:      boolean;
  createdAt:   string;
  creadoPor:   { nombre: string; rol: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MATERIAS = [
  "Lectura Crítica", "Matemáticas", "Ciencias Naturales",
  "Sociales y Ciudadanas", "Inglés",
];

const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};
const getMC = (m: string | null) =>
  m ? (MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30")
    : "bg-gray-500/20 text-gray-400 border-gray-500/30";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const inputCls = "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ tipo, msg, onClose }: { tipo: "ok" | "error"; msg: string; onClose: () => void }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-2xl",
      tipo === "ok"
        ? "border-green-500/30 bg-[#0d1526] text-green-400"
        : "border-red-500/30 bg-[#0d1526] text-red-400",
    )}>
      {tipo === "ok"
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span>{msg}</span>
      <button onClick={onClose}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Modal confirmar eliminación ────────────────────────────────────────────
function ModalEliminar({ titulo, onConfirm, onCancel, loading }: {
  titulo: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-base font-bold text-white">Eliminar material</h2>
        </div>
        <p className="text-sm text-gray-400">
          ¿Eliminar <span className="font-semibold text-white">"{titulo}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formulario crear/editar ────────────────────────────────────────────────
function FormMaterial({
  inicial,
  onClose,
  onGuardado,
}: {
  inicial?: Material | null;
  onClose: () => void;
  onGuardado: (m: Material) => void;
}) {
  const esEdicion = !!inicial;

  const [titulo,      setTitulo]      = useState(inicial?.titulo      ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [tipo,        setTipo]        = useState<TipoMaterial>(inicial?.tipo ?? "PDF");
  const [url,         setUrl]         = useState(inicial?.url         ?? "");
  const [materia,     setMateria]     = useState(inicial?.materia     ?? "");
  const [orden,       setOrden]       = useState(inicial?.orden       ?? 0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleGuardar = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!url.trim())    { setError("La URL es obligatoria.");   return; }
    setLoading(true); setError("");

    try {
      const body = { titulo, descripcion: descripcion || null, tipo, url, materia: materia || null, orden };
      const endpoint = esEdicion
        ? `/api/docente/material/${inicial!.id}`
        : "/api/docente/material";
      const method   = esEdicion ? "PUT" : "POST";

      const res  = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar.");
      onGuardado(data.material);
    } catch (e: any) {
      setError(e?.message ?? "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-green-400" />
            <h2 className="text-base font-bold text-white">
              {esEdicion ? "Editar material" : "Agregar material"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Tipo de material</label>
            <div className="flex gap-2">
              {(["PDF", "VIDEO"] as TipoMaterial[]).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition",
                    tipo === t
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white",
                  )}>
                  {t === "PDF"
                    ? <FileText className="h-4 w-4" />
                    : <Video className="h-4 w-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Título <span className="text-red-400">*</span>
            </label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Guía de Lectura Crítica" className={inputCls} disabled={loading} />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripción (opcional)</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del material…" rows={3}
              className={cn(inputCls, "resize-none")} disabled={loading} />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              URL del {tipo === "PDF" ? "PDF" : "video"} <span className="text-red-400">*</span>
            </label>
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={tipo === "PDF"
                ? "https://drive.google.com/file/d/..."
                : "https://youtube.com/watch?v=..."}
              className={inputCls} disabled={loading} />
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 transition">
                <ExternalLink className="h-2.5 w-2.5" />Verificar enlace
              </a>
            )}
          </div>

          {/* Materia y orden */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Materia (opcional)</label>
              <select value={materia} onChange={(e) => setMateria(e.target.value)}
                className={cn(inputCls, "cursor-pointer")} disabled={loading}>
                <option value="">General</option>
                {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Orden</label>
              <input type="number" value={orden} min={0}
                onChange={(e) => setOrden(Math.max(0, Number(e.target.value)))}
                className={inputCls} disabled={loading} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button onClick={onClose} disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {esEdicion ? "Guardar cambios" : "Agregar material"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card de material ───────────────────────────────────────────────────────
function MaterialCard({
  m, onEditar, onEliminar, onToggle,
}: {
  m: Material;
  onEditar:  (m: Material) => void;
  onEliminar:(m: Material) => void;
  onToggle:  (m: Material) => void;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-all",
      m.activo ? "border-white/10 hover:border-white/20" : "border-white/5 opacity-60",
    )}>
      {/* Franja tipo */}
      <div className={cn("h-1 w-full", m.tipo === "PDF" ? "bg-red-500" : "bg-blue-500")} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            m.tipo === "PDF" ? "bg-red-500/20" : "bg-blue-500/20",
          )}>
            {m.tipo === "PDF"
              ? <FileText className="h-5 w-5 text-red-400" />
              : <Video    className="h-5 w-5 text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-bold text-white truncate">{m.titulo}</h3>
              {!m.activo && (
                <span className="rounded-full bg-gray-500/20 border border-gray-500/30 px-2 py-0.5 text-[9px] font-bold text-gray-400">
                  Inactivo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {m.materia && (
                <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMC(m.materia))}>
                  {m.materia}
                </span>
              )}
              <span className={cn(
                "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                m.tipo === "PDF" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30",
              )}>
                {m.tipo}
              </span>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {m.descripcion && (
          <p className="text-xs text-gray-500 line-clamp-2">{m.descripcion}</p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1 border-t border-white/5">
          <span>Creado {fmtFecha(m.createdAt)}</span>
          <span className="truncate ml-2">{m.creadoPor?.nombre ?? "—"}</span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ver */}
          <a href={m.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition">
            <ExternalLink className="h-3 w-3" />Ver
          </a>

          {/* Editar */}
          <button onClick={() => onEditar(m)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition">
            <Pencil className="h-3 w-3" />Editar
          </button>

          {/* Toggle activo */}
          <button onClick={() => onToggle(m)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
              m.activo
                ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                : "border-green-500/20 text-green-400 hover:bg-green-500/10",
            )}>
            {m.activo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {m.activo ? "Desactivar" : "Activar"}
          </button>

          {/* Eliminar */}
          <button onClick={() => onEliminar(m)}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition">
            <Trash2 className="h-3 w-3" />Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function MaterialDocenteClient() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoMaterial>("TODOS");
  const [filtroActivo, setFiltroActivo] = useState<"TODOS" | "activos" | "inactivos">("TODOS");
  const [toast,      setToast]      = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const [modalForm,    setModalForm]    = useState<{ open: boolean; material?: Material }>({ open: false });
  const [modalEliminar, setModalEliminar] = useState<Material | null>(null);
  const [accionLoad,   setAccionLoad]   = useState(false);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/docente/material");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMateriales(data.materiales ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar materiales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Toggle activo
  const handleToggle = async (m: Material) => {
    try {
      const res  = await fetch(`/api/docente/material/${m.id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMateriales((prev) => prev.map((x) => x.id === m.id ? data.material : x));
      showToast("ok", `"${m.titulo}" ${data.material.activo ? "activado" : "desactivado"}.`);
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al cambiar estado.");
    }
  };

  // Eliminar
  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    setAccionLoad(true);
    try {
      const res  = await fetch(`/api/docente/material/${modalEliminar.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMateriales((prev) => prev.filter((x) => x.id !== modalEliminar.id));
      showToast("ok", `"${modalEliminar.titulo}" eliminado.`);
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al eliminar.");
    } finally {
      setAccionLoad(false);
      setModalEliminar(null);
    }
  };

  // Guardar (crear o editar)
  const handleGuardado = (material: Material) => {
    setMateriales((prev) => {
      const existe = prev.find((x) => x.id === material.id);
      if (existe) return prev.map((x) => x.id === material.id ? material : x);
      return [material, ...prev];
    });
    showToast("ok", modalForm.material ? "Material actualizado." : "Material agregado.");
    setModalForm({ open: false });
  };

  // Filtrar
  const filtrados = materiales.filter((m) => {
    const pasaTipo   = filtroTipo === "TODOS" || m.tipo === filtroTipo;
    const pasaActivo = filtroActivo === "TODOS"
      || (filtroActivo === "activos" && m.activo)
      || (filtroActivo === "inactivos" && !m.activo);
    const pasaBusqueda = !busqueda.trim() ||
      m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.materia ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase());
    return pasaTipo && pasaActivo && pasaBusqueda;
  });

  const totalPDF   = materiales.filter((m) => m.tipo === "PDF").length;
  const totalVideo = materiales.filter((m) => m.tipo === "VIDEO").length;
  const totalActivos = materiales.filter((m) => m.activo).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {modalForm.open && (
        <FormMaterial
          inicial={modalForm.material}
          onClose={() => setModalForm({ open: false })}
          onGuardado={handleGuardado}
        />
      )}

      {modalEliminar && (
        <ModalEliminar
          titulo={modalEliminar.titulo}
          onConfirm={confirmarEliminar}
          onCancel={() => setModalEliminar(null)}
          loading={accionLoad}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-white">Material Educativo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona PDFs y videos para tus estudiantes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setModalForm({ open: true })}
            className="flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-600 px-4 py-2 text-sm font-bold text-white transition">
            <Plus className="h-4 w-4" />Agregar material
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && materiales.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: materiales.length, color: "text-white"      },
            { label: "PDFs",     value: totalPDF,          color: "text-red-400"    },
            { label: "Videos",   value: totalVideo,        color: "text-blue-400"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-center">
              <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar material…"
            className="w-full rounded-xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
        </div>

        {/* Filtro tipo */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[var(--bg-card)] p-1">
          {(["TODOS", "PDF", "VIDEO"] as const).map((t) => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                filtroTipo === t ? "bg-green-700 text-white" : "text-gray-400 hover:text-white")}>
              {t === "TODOS" ? "Todos" : t}
            </button>
          ))}
        </div>

        {/* Filtro activo */}
        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="TODOS">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>

        <span className="text-xs text-gray-500 shrink-0">
          {filtrados.length} material{filtrados.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : materiales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700/20 border border-green-500/20">
            <BookOpen className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Sin materiales aún</p>
            <p className="text-sm text-gray-500 mt-1">Agrega el primer PDF o video para tus estudiantes.</p>
          </div>
          <button onClick={() => setModalForm({ open: true })}
            className="flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition">
            <Plus className="h-4 w-4" />Agregar material
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Filter className="h-10 w-10 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">Sin resultados para ese filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((m) => (
            <MaterialCard
              key={m.id}
              m={m}
              onEditar={(x) => setModalForm({ open: true, material: x })}
              onEliminar={(x) => setModalEliminar(x)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}