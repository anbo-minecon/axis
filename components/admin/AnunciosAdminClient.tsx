// components/admin/AnunciosAdminClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Image as ImageIcon, ExternalLink, Pencil,
  Trash2, Loader2, AlertTriangle, CheckCircle2,
  X, Eye, EyeOff, GripVertical, Link2, Upload,
  FileUp,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Anuncio {
  id: string;
  titulo: string;
  imagenUrl: string;
  linkUrl: string | null;
  activo: boolean;
  orden: number;
  creadoEn: string;
}

type ModoImagen = "url" | "archivo";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

// ── Toast ──────────────────────────────────────────────────────────────────
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

// ── Modal crear / editar ───────────────────────────────────────────────────
function AnuncioModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: Anuncio | null;
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [titulo,      setTitulo]      = useState(initial?.titulo    ?? "");
  const [imagenUrl,   setImagenUrl]   = useState(initial?.imagenUrl ?? "");
  const [linkUrl,     setLinkUrl]     = useState(initial?.linkUrl   ?? "");
  const [orden,       setOrden]       = useState(initial?.orden     ?? 0);
  const [modoImagen,  setModoImagen]  = useState<ModoImagen>(
    initial?.imagenUrl?.startsWith("/images/") ? "archivo" : "url"
  );
  const [archivo,     setArchivo]     = useState<File | null>(null);
  const [subiendo,    setSubiendo]    = useState(false);
  const [errorImg,    setErrorImg]    = useState("");
  const inputFileRef                  = useRef<HTMLInputElement>(null);

  const previewUrl = modoImagen === "archivo" && archivo
    ? URL.createObjectURL(archivo)
    : modoImagen === "url" && imagenUrl.startsWith("http")
    ? imagenUrl
    : initial?.imagenUrl ?? "";

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErrorImg("La imagen no puede superar 5MB."); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
      setErrorImg("Solo se aceptan JPG, PNG o WebP.");
      return;
    }
    setErrorImg("");
    setArchivo(f);
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) return;

    let urlFinal = imagenUrl;

    // Si hay archivo nuevo, subirlo primero
    if (modoImagen === "archivo" && archivo) {
      setSubiendo(true);
      try {
        const fd = new FormData();
        fd.append("imagen", archivo);
        const r = await fetch("/api/admin/anuncios/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) { setErrorImg(d.error ?? "Error al subir la imagen."); setSubiendo(false); return; }
        urlFinal = d.url;
      } catch {
        setErrorImg("Error de conexión al subir la imagen.");
        setSubiendo(false);
        return;
      }
      setSubiendo(false);
    }

    if (!urlFinal) { setErrorImg("Debes agregar una imagen."); return; }

    onSave({
      titulo,
      imagenUrl: urlFinal,
      linkUrl: linkUrl.trim() || null,
      orden,
    });
  };

  const ocupado = saving || subiendo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-white">
            {initial ? "Editar anuncio" : "Nuevo anuncio"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">

          {/* Selector modo imagen */}
          <div className="flex gap-2">
            {([
              { id: "url",     label: "URL externa",    icon: Link2   },
              { id: "archivo", label: "Subir archivo",  icon: FileUp  },
            ] as { id: ModoImagen; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setModoImagen(id); setErrorImg(""); }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition",
                  modoImagen === id
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div
              className="relative w-full overflow-hidden rounded-xl bg-black/30"
              style={{ height: "180px" }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white font-semibold">
                Preview
              </div>
            </div>
          )}

          {/* Imagen — URL */}
          {modoImagen === "url" && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                URL de la imagen <span className="text-red-400">*</span>
              </label>
              <input
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                placeholder="https://i.imgur.com/... o link directo de Drive"
                className={inputCls}
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Tamaño recomendado: <span className="text-blue-400 font-semibold">1280 × 720 px</span>.
                El carrusel adapta cualquier tamaño automáticamente.
              </p>
            </div>
          )}

          {/* Imagen — Archivo */}
          {modoImagen === "archivo" && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Imagen <span className="text-red-400">*</span>
              </label>
              <input
                ref={inputFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleArchivo}
              />
              <button
                onClick={() => inputFileRef.current?.click()}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition",
                  archivo
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-dashed border-white/20 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {archivo ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {archivo.name} ({(archivo.size / 1024).toFixed(0)} KB)
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Haz clic para seleccionar imagen
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-600 mt-1">
                JPG, PNG o WebP · máx. 5MB · recomendado 1280×720 px.
                Se guardará en <span className="text-blue-400 font-mono">public/images/anuncios/</span>
              </p>
            </div>
          )}

          {/* Error imagen */}
          {errorImg && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {errorImg}
            </p>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Descripción interna <span className="text-red-400">*</span>
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Campaña inicio de año 2025"
              className={inputCls}
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Solo para identificar el anuncio en el panel. No visible en la landing.
            </p>
          </div>

          {/* Link opcional */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Enlace al hacer clic{" "}
              <span className="text-gray-600 font-normal">(opcional)</span>
            </label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://... (dejar vacío si no abre ninguna página)"
              className={inputCls}
            />
          </div>

          {/* Orden */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Orden en el carrusel
            </label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(Number(e.target.value))}
              min={0}
              className={cn(inputCls, "w-32")}
            />
            <p className="text-[10px] text-gray-600 mt-1">Número menor = aparece primero.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            disabled={ocupado}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={ocupado || !titulo.trim() || (modoImagen === "url" && !imagenUrl.trim()) || (modoImagen === "archivo" && !archivo && !initial)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            {subiendo ? "Subiendo imagen…" : saving ? "Guardando…" : initial ? "Guardar cambios" : "Publicar anuncio"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal eliminar ─────────────────────────────────────────────────────────
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
          <h2 className="text-base font-bold text-white">Eliminar anuncio</h2>
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

// ── Chip materia color ─────────────────────────────────────────────────────
const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

// ── Componente principal ───────────────────────────────────────────────────
export function AnunciosAdminClient() {
  const [anuncios,     setAnuncios]     = useState<Anuncio[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);
  const [modal,        setModal]        = useState<"crear" | "editar" | "eliminar" | null>(null);
  const [seleccionado, setSeleccionado] = useState<Anuncio | null>(null);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/anuncios");
      const d = await r.json();
      setAnuncios(d.anuncios ?? []);
    } catch {
      showToast("error", "No se pudieron cargar los anuncios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (data: any) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) { showToast("error", d.error ?? "Error al crear."); return; }
      showToast("ok", "Anuncio publicado.");
      setModal(null);
      cargar();
    } catch { showToast("error", "Error de conexión."); }
    finally { setSaving(false); }
  };

  const handleEditar = async (data: any) => {
    if (!seleccionado) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/anuncios/${seleccionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) { showToast("error", d.error ?? "Error al editar."); return; }
      showToast("ok", "Anuncio actualizado.");
      setModal(null);
      setSeleccionado(null);
      cargar();
    } catch { showToast("error", "Error de conexión."); }
    finally { setSaving(false); }
  };

  const handleToggle = async (a: Anuncio) => {
    try {
      await fetch(`/api/admin/anuncios/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !a.activo }),
      });
      cargar();
    } catch { showToast("error", "Error al cambiar estado."); }
  };

  const handleEliminar = async () => {
    if (!seleccionado) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/anuncios/${seleccionado.id}`, { method: "DELETE" });
      if (!r.ok) { showToast("error", "Error al eliminar."); return; }
      showToast("ok", "Anuncio eliminado.");
      setModal(null);
      setSeleccionado(null);
      cargar();
    } catch { showToast("error", "Error de conexión."); }
    finally { setSaving(false); }
  };

  const activos   = anuncios.filter((a) => a.activo).length;
  const inactivos = anuncios.filter((a) => !a.activo).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">

      {/* Modales */}
      {modal === "crear" && (
        <AnuncioModal onSave={handleCrear} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal === "editar" && seleccionado && (
        <AnuncioModal
          initial={seleccionado}
          onSave={handleEditar}
          onClose={() => { setModal(null); setSeleccionado(null); }}
          saving={saving}
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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-white">Anuncios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos} activo{activos !== 1 ? "s" : ""} en el carrusel
            {inactivos > 0 && ` · ${inactivos} oculto${inactivos !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activos < 5 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-300">
                Mínimo 5 anuncios recomendados
              </span>
            </div>
          )}
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo anuncio
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3.5">
        <ImageIcon className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300 leading-relaxed">
          <span className="font-bold text-blue-200">Tamaño recomendado:</span>{" "}
          <span className="font-mono text-white">1280 × 720 px</span> (16:9).
          También puedes subir imágenes de otros tamaños — el carrusel las adapta automáticamente.
          Puedes usar URL externa (Imgur, Drive) o subir el archivo directamente al servidor.
        </p>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : anuncios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-white/10">
          <ImageIcon className="h-12 w-12 text-gray-700" />
          <div>
            <p className="text-sm font-semibold text-gray-500">Sin anuncios publicados</p>
            <p className="text-xs text-gray-600 mt-1">Crea el primer banner para el carrusel.</p>
          </div>
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Crear primer anuncio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {anuncios.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border overflow-hidden transition",
                a.activo
                  ? "border-white/10 bg-[var(--bg-card)]"
                  : "border-white/5 bg-white/[0.02] opacity-60"
              )}
            >
              {/* Preview — altura fija como en el carrusel real */}
              <div className="relative w-full overflow-hidden bg-black/20" style={{ height: "160px" }}>
                <img
                  src={a.imagenUrl}
                  alt={a.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    el.parentElement!.innerHTML +=
                      `<div class="absolute inset-0 flex items-center justify-center"><span class="text-xs text-gray-600">Imagen no disponible</span></div>`;
                  }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    #{a.orden}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    a.activo ? "bg-green-600/80 text-white" : "bg-gray-700/80 text-gray-300"
                  )}>
                    {a.activo ? "Activo" : "Oculto"}
                  </span>
                  {a.imagenUrl.startsWith("/images/") && (
                    <span className="rounded-full bg-blue-600/80 px-2 py-0.5 text-[10px] font-bold text-white">
                      Local
                    </span>
                  )}
                  {a.linkUrl && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                      <Link2 className="h-2.5 w-2.5" />
                      Con enlace
                    </span>
                  )}
                </div>
              </div>

              {/* Info + acciones */}
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{a.titulo}</p>
                  <p className="text-[10px] text-gray-600 truncate mt-0.5">{a.imagenUrl}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.linkUrl && (
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title="Abrir enlace"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleToggle(a)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition",
                      a.activo
                        ? "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10"
                        : "text-gray-600 hover:text-green-400 hover:bg-green-500/10"
                    )}
                    title={a.activo ? "Ocultar" : "Mostrar"}
                  >
                    {a.activo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { setSeleccionado(a); setModal("editar"); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setSeleccionado(a); setModal("eliminar"); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}