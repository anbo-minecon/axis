"use client";

// app/dashboard/classroom/clases/[id]/page.tsx
// Tablón de clase — Anuncios + Tareas en tiempo real desde Google Classroom API
// Tab "Tablón" → anuncios, Tab "Tareas" → tareas con entrega
// MaterialChip con miniaturas, botón Actualizar, alertas de vencimiento

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, AlertCircle, Loader, RefreshCw,
  ExternalLink, Clock, FileText, Image, Video,
  Play, Download, Link as LinkIcon, X,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface MaterialAdjunto {
  titulo: string;
  tipo: "YOUTUBE" | "DRIVE_FILE" | "LINK" | "FORM";
  url: string;
  thumbnail?: string;
}

interface Anuncio {
  id: string;
  texto: string;
  autor: string;
  fecha: string;
  materiales: MaterialAdjunto[];
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fechaEntrega: string | null;
  puntosPosibles: number | null;
  materiales: MaterialAdjunto[];
  estado: "NO_ASIGNADA" | "ASIGNADA" | "ENTREGADA" | "CALIFICADA";
}

interface Clase {
  nombre: string;
  materia: string | null;
  seccion: string | null;
  docente: { nombre: string | null } | null;
}

type Tab = "tablon" | "tareas";

// ── Helper: Renderizar chip de material ───────────────────────────────────────
function MaterialChip({ material }: { material: MaterialAdjunto }) {
  let icon = <FileText className="h-4 w-4" />;
  let color = "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

  if (material.tipo === "YOUTUBE") {
    icon = <Play className="h-4 w-4" />;
    color = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  } else if (material.tipo === "DRIVE_FILE") {
    icon = <Download className="h-4 w-4" />;
    color = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  } else if (material.tipo === "FORM") {
    icon = <FileText className="h-4 w-4" />;
    color = "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  } else if (material.tipo === "LINK") {
    icon = <LinkIcon className="h-4 w-4" />;
    color = "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  }

  return (
    <a href={material.url} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${color} hover:opacity-75 transition group`}>
      {material.thumbnail && (
        <img src={material.thumbnail} alt={material.titulo} className="h-4 w-4 rounded object-cover" />
      )}
      {!material.thumbnail && icon}
      <span className="truncate max-w-xs group-hover:underline">{material.titulo}</span>
    </a>
  );
}

// ── Helper: Días restantes ────────────────────────────────────────────────────
function diasRestantes(fecha: string): { texto: string; urgente: boolean } {
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { texto: "Vencida",          urgente: true };
  if (diff === 0) return { texto: "Hoy",             urgente: true };
  if (diff === 1) return { texto: "Mañana",          urgente: true };
  return { texto: `${diff} días`,                    urgente: diff <= 3 };
}

export default function TablonClasePage() {
  const params = useParams();
  const claseId = params.id as string;

  const [tab, setTab]       = useState<Tab>("tablon");
  const [clase, setClase]   = useState<Clase | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  // ── Cargar datos ──────────────────────────────────────────────────────────
  async function cargarDatos() {
    if (!claseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/feed?claseId=${claseId}`);
      if (!res.ok) throw new Error("Error al cargar feed");
      const data = await res.json();
      setClase(data.clase);
      setAnuncios(data.anuncios ?? []);
      setTareas(data.tareas ?? []);
    } catch (err) {
      console.error(err);
      Toast.error("Error", "No se pudo cargar el feed");
    } finally {
      setLoading(false);
    }
  }

  async function forzarActualizar() {
    setActualizando(true);
    try {
      const res = await fetch(`/api/classroom/feed?claseId=${claseId}&force=true`);
      if (!res.ok) throw new Error("Error al actualizar");
      const data = await res.json();
      setClase(data.clase);
      setAnuncios(data.anuncios ?? []);
      setTareas(data.tareas ?? []);
      Toast.success("Actualizado", "Feed actualizado correctamente");
    } catch (err) {
      console.error(err);
      Toast.error("Error", "No se pudo actualizar");
    } finally {
      setActualizando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [claseId]);

  if (loading) {
    return (
      <div className="min-h-full p-4 md:p-6 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!clase) {
    return (
      <div className="min-h-full p-4 md:p-6">
        <Link href="/dashboard/classroom"
          className="inline-flex items-center gap-1.5 mb-4 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="flex items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-500">Clase no encontrada</p>
        </div>
      </div>
    );
  }

  const tareasUrgentes = tareas.filter(t => {
    if (!t.fechaEntrega) return false;
    const diff = Math.ceil((new Date(t.fechaEntrega).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= 0;
  });

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/classroom"
            className="inline-flex items-center gap-1.5 mb-3 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clase.nombre}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {clase.materia && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {clase.materia}
              </span>
            )}
            {clase.seccion && <span>{clase.seccion}</span>}
            {clase.docente?.nombre && <span>Prof. {clase.docente.nombre}</span>}
          </div>
        </div>

        {/* Botón Actualizar */}
        <button onClick={forzarActualizar} disabled={actualizando}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 text-xs font-medium transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${actualizando ? "animate-spin" : ""}`} />
          {actualizando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Alerta de tareas urgentes */}
      {tareasUrgentes.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-300">
              {tareasUrgentes.length} {tareasUrgentes.length === 1 ? "tarea próxima" : "tareas próximas"} a vencer
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Revisa las tareas con entrega en ≤ 3 días
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
        {[
          { key: "tablon" as Tab, label: "Tablón", icon: FileText, count: anuncios.length },
          { key: "tareas" as Tab, label: "Tareas", icon: BookOpen, count: tareas.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === key
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            <Icon className="h-4 w-4" />
            {label}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === key ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {/* ── Tab Tablón (Anuncios) ── */}
        {tab === "tablon" && (
          anuncios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay anuncios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {anuncios.map(anuncio => (
                <div key={anuncio.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition">
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{anuncio.autor}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(anuncio.fecha).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Contenido */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{anuncio.texto}</p>

                  {/* Materiales adjuntos */}
                  {anuncio.materiales.length > 0 && (
                    <div className="pt-3 border-t border-gray-50 dark:border-gray-700/50">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Adjuntos:</p>
                      <div className="flex flex-wrap gap-2">
                        {anuncio.materiales.map((mat, idx) => (
                          <MaterialChip key={idx} material={mat} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Tab Tareas ── */}
        {tab === "tareas" && (
          tareas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay tareas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map(tarea => {
                const entrega = tarea.fechaEntrega ? diasRestantes(tarea.fechaEntrega) : null;
                return (
                  <div key={tarea.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition">
                    {/* Encabezado */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{tarea.titulo}</h4>
                        {tarea.descripcion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tarea.descripcion}</p>
                        )}
                      </div>

                      {/* Entrega */}
                      {entrega && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                          entrega.urgente
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {entrega.texto}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {tarea.puntosPosibles && (
                        <span>{tarea.puntosPosibles} pts</span>
                      )}
                      {tarea.fechaEntrega && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tarea.fechaEntrega).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {/* Materiales adjuntos */}
                    {tarea.materiales.length > 0 && (
                      <div className="pt-3 border-t border-gray-50 dark:border-gray-700/50">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Archivos de la tarea:</p>
                        <div className="flex flex-wrap gap-2">
                          {tarea.materiales.map((mat, idx) => (
                            <MaterialChip key={idx} material={mat} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
