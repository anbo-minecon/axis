"use client";

// app/dashboard/classroom/page.tsx
// Vista de Google Classroom para ESTUDIANTES — solo lectura

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap, Video, BookOpen, Calendar,
  ExternalLink, Clock, AlertCircle, Loader,
  ChevronRight, PlayCircle,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface Clase {
  id:     string;
  nombre: string;
  materia: string | null;
  seccion: string | null;
  enlaceAlternativo: string | null;
  docente: { nombre: string | null } | null;
  _count:  { grabaciones: number; tareas: number; eventos: number };
}

interface Grabacion {
  id:          string;
  titulo:      string;
  linkUrl:     string;
  fecha:       string;
  duracionMin: number | null;
  materia:     string | null;
  clase:       { nombre: string };
}

interface Tarea {
  id:             string;
  titulo:         string;
  descripcion:    string | null;
  linkUrl:        string | null;
  fechaEntrega:   string | null;
  puntosPosibles: number | null;
  clase:          { nombre: string; materia: string | null };
}

const MATERIA_COLOR: Record<string, string> = {
  "Matemáticas":        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Lectura Crítica":    "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Ciencias Naturales": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Sociales":           "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Inglés":             "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function colorMateria(m: string | null) {
  if (!m) return "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  return MATERIA_COLOR[m] ?? "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
}

function diasRestantes(fecha: string): { texto: string; urgente: boolean } {
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { texto: "Vencida",          urgente: true };
  if (diff === 0) return { texto: "Hoy",             urgente: true };
  if (diff === 1) return { texto: "Mañana",          urgente: true };
  return { texto: `${diff} días`,                    urgente: diff <= 3 };
}

type Tab = "clases" | "grabaciones" | "tareas";

export default function ClassroomEstudiantePage() {
  const [tab, setTab]             = useState<Tab>("clases");
  const [clases, setClases]       = useState<Clase[]>([]);
  const [grabaciones, setGrab]    = useState<Grabacion[]>([]);
  const [tareas, setTareas]       = useState<Tarea[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setLoading(true);
    try {
      const [cr, gr, tr] = await Promise.all([
        fetch("/api/classroom/clases"),
        fetch("/api/classroom/grabaciones"),
        fetch("/api/classroom/tareas"),
      ]);
      const [cd, gd, td] = await Promise.all([cr.json(), gr.json(), tr.json()]);
      setClases(cd.clases      ?? []);
      setGrab(gd.grabaciones   ?? []);
      setTareas(td.tareas      ?? []);
    } catch {
      Toast.error("Error", "No se pudo cargar el contenido");
    } finally {
      setLoading(false);
    }
  }

  const tareasVigentes = tareas.filter(t => {
    if (!t.fechaEntrega) return true;
    return new Date(t.fechaEntrega).getTime() >= Date.now() - 86400000;
  });

  const TABS = [
    { key: "clases"      as Tab, label: "Mis Clases",   icon: GraduationCap, count: clases.length },
    { key: "grabaciones" as Tab, label: "Grabaciones",  icon: Video,         count: grabaciones.length },
    { key: "tareas"      as Tab, label: "Tareas",       icon: BookOpen,      count: tareasVigentes.length },
  ];

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-purple-600" />
          Mi Classroom
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Clases, grabaciones y tareas de tu grupo
        </p>
      </div>

      {/* Resumen rápido */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Clases",      value: clases.length,            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
            { label: "Grabaciones", value: grabaciones.length,       color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
            { label: "Tareas",      value: tareasVigentes.length,    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm text-center">
              <p className={`text-2xl font-bold ${color.split(" ")[0]}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* ── Tab Clases ── */}
          {tab === "clases" && (
            clases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tienes clases asignadas</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Contacta a tu administrador</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clases.map(c => (
                  <Link key={c.id} href={`/dashboard/classroom/clases/${c.id}`}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-600 transition-all cursor-pointer group">
                    {/* Materia badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${colorMateria(c.materia)}`}>
                        {c.materia ?? "General"}
                      </span>
                      {c.enlaceAlternativo && (
                        <a href={c.enlaceAlternativo} target="_blank" rel="noopener noreferrer" onClick={(e) => e.preventDefault()}
                          className="text-gray-400 hover:text-purple-600 transition">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">{c.nombre}</h3>
                    {c.seccion && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{c.seccion}</p>}
                    {c.docente?.nombre && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                        Prof. {c.docente.nombre}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Video className="h-3 w-3" />{c._count.grabaciones}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{c._count.tareas}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c._count.eventos}</span>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.preventDefault(); window.location.href = `/dashboard/classroom/grabaciones?claseId=${c.id}`; }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-medium py-2 transition">
                        <PlayCircle className="h-3.5 w-3.5" /> Ver clases
                      </button>
                      <button onClick={(e) => { e.preventDefault(); window.location.href = `/dashboard/classroom/tareas?claseId=${c.id}`; }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-medium py-2 transition">
                        <BookOpen className="h-3.5 w-3.5" /> Tareas
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* ── Tab Grabaciones ── */}
          {tab === "grabaciones" && (
            grabaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Video className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay grabaciones disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grabaciones.map(g => (
                  <a key={g.id} href={g.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 transition group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition">
                        <PlayCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition">
                          {g.titulo}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          <span>{g.clase.nombre}</span>
                          {g.materia && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colorMateria(g.materia)}`}>
                              {g.materia}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(g.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                          </span>
                          {g.duracionMin && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> {g.duracionMin} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 group-hover:text-purple-600 transition" />
                  </a>
                ))}
              </div>
            )
          )}

          {/* ── Tab Tareas ── */}
          {tab === "tareas" && (
            tareasVigentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay tareas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tareasVigentes.map(t => {
                  const entrega = t.fechaEntrega ? diasRestantes(t.fechaEntrega) : null;
                  return (
                    <div key={t.id}
                      className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            entrega?.urgente
                              ? "bg-red-50 dark:bg-red-900/20"
                              : "bg-amber-50 dark:bg-amber-900/20"
                          }`}>
                            {entrega?.urgente
                              ? <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              : <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.titulo}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {t.clase.nombre}
                              {t.clase.materia && ` · ${t.clase.materia}`}
                            </p>
                            {t.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                {t.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {entrega && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              entrega.urgente
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}>
                              {entrega.texto}
                            </span>
                          )}
                          {t.puntosPosibles && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.puntosPosibles} pts</p>
                          )}
                        </div>
                      </div>

                      {t.linkUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                          <a href={t.linkUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" /> Ver tarea en Classroom
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* Acceso al calendario */}
      <div className="mt-6">
        <Link href="/dashboard/classroom/calendario"
          className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition group">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ver calendario</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Próximas clases y eventos</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
        </Link>
      </div>
    </div>
  );
}