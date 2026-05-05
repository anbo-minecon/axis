// components/dashboard/MaterialClient.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileText, Youtube, ExternalLink, X,
  Loader2, AlertCircle, BookOpen, Search,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Material {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "PDF" | "VIDEO";
  url: string;
  materia: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

const TIPO_ICON_BG: Record<string, string> = {
  PDF:   "bg-blue-500/20",
  VIDEO: "bg-red-500/20",
};

// Extraer thumbnail de YouTube
function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
}

// Convertir URL de Drive a modo preview
function getDrivePreviewUrl(url: string): string {
  // https://drive.google.com/file/d/ID/view → /preview
  return url.replace(/\/view.*$/, "/preview");
}

// ── Modal de detalle ───────────────────────────────────────────────────────
function MaterialModal({ m, onClose }: { m: Material; onClose: () => void }) {
  const esPDF   = m.tipo === "PDF";
  const esVideo = m.tipo === "VIDEO";
  const thumb   = esVideo ? getYoutubeThumbnail(m.url) : null;

  // Cerrar con Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-card)] shadow-2xl overflow-hidden">

        {/* Preview visual */}
        <div className="relative h-52 w-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center overflow-hidden">
          {esVideo && thumb ? (
            <img
              src={thumb}
              alt={m.titulo}
              className="h-full w-full object-cover"
            />
          ) : esPDF ? (
            <div className="flex flex-col items-center gap-3 opacity-40">
              <FileText className="h-20 w-20 text-blue-300" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">PDF</span>
            </div>
          ) : null}

          {/* Overlay con ícono de tipo */}
          <div className={cn(
            "absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm border",
            esPDF
              ? "bg-blue-900/80 text-blue-300 border-blue-500/30"
              : "bg-red-900/80 text-red-300 border-red-500/30"
          )}>
            {esPDF
              ? <FileText className="h-3 w-3" />
              : <Youtube className="h-3 w-3" />}
            {esPDF ? "Documento PDF" : "Video"}
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">

          {/* Materia */}
          {m.materia && (
            <span className={cn(
              "inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
              getMateriaColor(m.materia)
            )}>
              {m.materia}
            </span>
          )}

          {/* Título */}
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] leading-tight">
            {m.titulo}
          </h2>

          {/* Descripción */}
          {m.descripcion && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {m.descripcion}
            </p>
          )}

          {/* Info tipo */}
          <div className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            esPDF
              ? "border-blue-500/20 bg-blue-500/10"
              : "border-red-500/20 bg-red-500/10"
          )}>
            {esPDF
              ? <FileText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              : <Youtube className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {esPDF
                ? "Este documento está alojado en Google Drive. Se abrirá en una nueva pestaña con el visor de Drive."
                : "Este video está alojado en YouTube. Se abrirá en una nueva pestaña para que lo veas sin interrupciones."}
            </p>
          </div>

          {/* Botón de acción */}
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition",
              esPDF
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            <ExternalLink className="h-4 w-4" />
            {esPDF ? "Abrir en Google Drive" : "Ver en YouTube"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
function MaterialCard({ m, onClick }: { m: Material; onClick: () => void }) {
  const esPDF   = m.tipo === "PDF";
  const thumb   = m.tipo === "VIDEO" ? getYoutubeThumbnail(m.url) : null;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition"
    >
      {/* Preview */}
      <div className="relative h-44 w-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 overflow-hidden flex items-center justify-center">
        {thumb ? (
          <img
            src={thumb}
            alt={m.titulo}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-50 transition">
            <FileText className="h-16 w-16 text-blue-300" />
          </div>
        )}

        {/* Badge tipo */}
        <div className={cn(
          "absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border",
          esPDF
            ? "bg-blue-900/80 text-blue-300 border-blue-500/30"
            : "bg-red-900/80 text-red-300 border-red-500/30"
        )}>
          {esPDF
            ? <FileText className="h-3 w-3" />
            : <Youtube className="h-3 w-3" />}
          {esPDF ? "PDF" : "Video"}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {m.materia && (
          <span className={cn(
            "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            getMateriaColor(m.materia)
          )}>
            {m.materia}
          </span>
        )}
        <p className="text-sm font-bold text-[var(--text-primary)] leading-tight line-clamp-2 group-hover:text-blue-300 transition">
          {m.titulo}
        </p>
        {m.descripcion && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {m.descripcion}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-blue-400 font-semibold pt-1">
          <ExternalLink className="h-3 w-3" />
          {esPDF ? "Ver documento" : "Ver video"}
        </p>
      </div>
    </button>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export function MaterialClient() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [seleccionado, setSeleccionado] = useState<Material | null>(null);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "PDF" | "VIDEO">("todos");
  const [filtroMateria, setFiltroMateria] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/material")
      .then((r) => r.json())
      .then((d) => setMateriales(d.materiales ?? []))
      .catch(() => setError("No se pudieron cargar los materiales."))
      .finally(() => setLoading(false));
  }, []);

  // Materias únicas para el filtro
  const materias = [...new Set(materiales.map((m) => m.materia).filter(Boolean))] as string[];

  // Filtrado
  const filtrados = materiales.filter((m) => {
    const matchBusqueda = !busqueda ||
      m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const matchMateria = !filtroMateria || m.materia === filtroMateria;
    return matchBusqueda && matchTipo && matchMateria;
  });

  const pdfs   = filtrados.filter((m) => m.tipo === "PDF").length;
  const videos = filtrados.filter((m) => m.tipo === "VIDEO").length;

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-5">

      {/* Modal */}
      {seleccionado && (
        <MaterialModal m={seleccionado} onClose={() => setSeleccionado(null)} />
      )}

      {/* ── Búsqueda y filtros ── */}
      <div className="space-y-3">

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar material..."
            className="w-full rounded-2xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipo */}
          {(["todos", "PDF", "VIDEO"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                filtroTipo === t
                  ? "bg-blue-600 text-white"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-white/20"
              )}
            >
              {t === "PDF" && <FileText className="h-3.5 w-3.5" />}
              {t === "VIDEO" && <Youtube className="h-3.5 w-3.5" />}
              {t === "todos" ? "Todos" : t === "PDF" ? "PDFs" : "Videos"}
            </button>
          ))}

          {/* Separador */}
          {materias.length > 0 && <div className="h-5 w-px bg-white/10" />}

          {/* Materias */}
          {materias.map((mat) => (
            <button
              key={mat}
              onClick={() => setFiltroMateria(filtroMateria === mat ? "" : mat)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                filtroMateria === mat
                  ? "bg-blue-600 text-white"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-white/20"
              )}
            >
              {mat}
            </button>
          ))}

          {/* Contador */}
          {!loading && (
            <span className="ml-auto text-xs text-[var(--text-muted)]">
              {pdfs > 0 && `${pdfs} PDF${pdfs !== 1 ? "s" : ""}`}
              {pdfs > 0 && videos > 0 && " · "}
              {videos > 0 && `${videos} video${videos !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

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
      ) : materiales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20">
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <p className="text-base font-bold text-[var(--text-primary)]">
              Sin materiales disponibles
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
              Los recursos estarán disponibles pronto. Vuelve a revisar más tarde.
            </p>
          </div>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="h-10 w-10 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">
            No hay materiales que coincidan con tu búsqueda
          </p>
          <button
            onClick={() => { setBusqueda(""); setFiltroTipo("todos"); setFiltroMateria(""); }}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((m) => (
            <MaterialCard key={m.id} m={m} onClick={() => setSeleccionado(m)} />
          ))}
        </div>
      )}
    </div>
  );
}