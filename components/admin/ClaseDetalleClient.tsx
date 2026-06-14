// components/admin/ClaseDetalleClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Plus, Video, BookOpen, Calendar, Users,
  ExternalLink, Pencil, Trash2, Loader2, AlertTriangle,
  X, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toast } from "@/lib/notifications";

interface Evento {
  id:           string;
  titulo:       string;
  tipo:         string;
  fechaInicio:  Date;
  linkMeet?:    string;
  completado:   boolean;
}

interface Tarea {
  id:           string;
  titulo:       string;
  estado:       string;
  fechaEntrega: Date | null;
  puntosPosibles: number | null;
}

interface Grabacion {
  id:      string;
  titulo:  string;
  fecha:   Date;
  linkUrl: string;
  duracionMin?: number;
}

interface Miembro {
  id:        string;
  nombre:    string;
  email:     string;
  imagen:    string | null;
  documento: string | null;
  grado:     number | null;
}

interface Clase {
  id:                string;
  googleCourseId:    string;
  nombre:            string;
  descripcion:       string | null;
  materia:           string | null;
  seccion:           string | null;
  estado:            string;
  enlaceAlternativo: string | null;
  createdAt:         Date;
  docente:           any;
  grupo:             any;
  eventos:           Evento[];
  tareas:            Tarea[];
  grabaciones:       Grabacion[];
  _count:            { eventos: number; tareas: number; grabaciones: number };
}

interface ClaseDetalleClientProps {
  claseId:   string;
  clase:     Clase;
  miembros:  Miembro[];
  userRole:  "ADMIN" | "DOCENTE";
  userId:    string;
}

export function ClaseDetalleClient({
  claseId,
  clase,
  miembros,
  userRole,
  userId,
}: ClaseDetalleClientProps) {
  const [activeTab, setActiveTab] = useState<"eventos" | "tareas" | "grabaciones" | "miembros">("eventos");
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [modalCrear, setModalCrear] = useState<"evento" | "tarea" | "grabacion" | null>(null);
  const [editando, setEditando] = useState<any>(null);
  const [miembrosActuales, setMiembrosActuales] = useState<Miembro[]>(miembros);

  // Form state
  const [formData, setFormData] = useState({
    titulo:       "",
    descripcion:  "",
    tipo:         "CLASE",
    fechaInicio:  "",
    linkMeet:     "",
    linkUrl:      "",
    materia:      "",
    fecha:        "",
    duracionMin:  "",
    fechaEntrega: "",
    puntosPosibles: "",
  });

  const handleEliminar = async (tipo: string, id: string) => {
    if (!confirm("¿Estás seguro?")) return;

    setLoading(true);
    try {
      const endpoint =
        tipo === "evento" ? "/api/classroom/calendario" :
        tipo === "tarea" ? "/api/classroom/tareas" :
        "/api/classroom/grabaciones";

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        Toast.error("Error", "No se pudo eliminar");
        return;
      }

      Toast.success("Eliminado", `${tipo} eliminado correctamente`);
      window.location.reload();
    } catch {
      Toast.error("Error", "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = "";
      let method = "POST";
      let body: any = {};

      if (modalCrear === "evento") {
        endpoint = "/api/classroom/calendario";
        body = {
          claseId,
          titulo: formData.titulo,
          descripcion: formData.descripcion || undefined,
          tipo: formData.tipo,
          fechaInicio: formData.fechaInicio,
          linkMeet: formData.linkMeet || undefined,
        };
      } else if (modalCrear === "tarea") {
        endpoint = "/api/classroom/tareas";
        body = {
          claseId,
          titulo: formData.titulo,
          descripcion: formData.descripcion || undefined,
          linkUrl: formData.linkUrl || undefined,
          fechaEntrega: formData.fechaEntrega || undefined,
          puntosPosibles: formData.puntosPosibles ? parseInt(formData.puntosPosibles) : undefined,
        };
      } else if (modalCrear === "grabacion") {
        endpoint = "/api/classroom/grabaciones";
        body = {
          claseId,
          titulo: formData.titulo,
          descripcion: formData.descripcion || undefined,
          linkUrl: formData.linkUrl,
          materia: formData.materia || undefined,
          fecha: formData.fecha,
          duracionMin: formData.duracionMin ? parseInt(formData.duracionMin) : undefined,
        };
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        Toast.error("Error", data.error || "Error al crear");
        return;
      }

      Toast.success("Éxito", "Creado correctamente");
      setModalCrear(null);
      setFormData({
        titulo: "", descripcion: "", tipo: "CLASE", fechaInicio: "",
        linkMeet: "", linkUrl: "", materia: "", fecha: "",
        duracionMin: "", fechaEntrega: "", puntosPosibles: "",
      });
      window.location.reload();
    } catch {
      Toast.error("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/classroom"
            className="inline-flex items-center gap-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 mb-4 text-sm text-gray-600 dark:text-gray-400 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{clase.nombre}</h1>
          {clase.seccion && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sección: {clase.seccion}</p>
          )}
        </div>
        {clase.enlaceAlternativo && (
          <a
            href={clase.enlaceAlternativo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-medium transition"
          >
            <ExternalLink className="h-4 w-4" /> Abrir en Classroom
          </a>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Docente */}
        {clase.docente && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Docente</p>
            <div className="flex items-center gap-3">
              {clase.docente.imagen && (
                <Image
                  src={clase.docente.imagen}
                  alt={clase.docente.nombre}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{clase.docente.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{clase.docente.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grupo */}
        {clase.grupo && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Grupo</p>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{clase.grupo.nombre}</p>
            </div>
          </div>
        )}

        {/* Materia */}
        {clase.materia && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Materia</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{clase.materia}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Eventos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clase._count.eventos}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tareas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clase._count.tareas}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Grabaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clase._count.grabaciones}</p>
            </div>
            <Video className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: "eventos", label: "Eventos", icon: Calendar },
            { id: "tareas", label: "Tareas", icon: BookOpen },
            { id: "grabaciones", label: "Grabaciones", icon: Video },
            { id: "miembros", label: "Miembros", icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition whitespace-nowrap",
                  active
                    ? "border-purple-600 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Eventos */}
        {activeTab === "eventos" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Eventos de la clase</h2>
              <button
                onClick={() => setModalCrear("evento")}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium transition"
              >
                <Plus className="h-4 w-4" /> Nuevo evento
              </button>
            </div>

            {clase.eventos.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No hay eventos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clase.eventos.map(evento => (
                  <div key={evento.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{evento.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(evento.fechaInicio).toLocaleString()}
                        </p>
                        {evento.linkMeet && (
                          <a
                            href={evento.linkMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> Google Meet
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleEliminar("evento", evento.id)}
                        disabled={loading}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tareas */}
        {activeTab === "tareas" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tareas asignadas</h2>
              <button
                onClick={() => setModalCrear("tarea")}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm font-medium transition"
              >
                <Plus className="h-4 w-4" /> Nueva tarea
              </button>
            </div>

            {clase.tareas.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No hay tareas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clase.tareas.map(tarea => (
                  <div key={tarea.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{tarea.titulo}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {tarea.estado}
                          </span>
                        </div>
                        {tarea.fechaEntrega && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Entrega: {new Date(tarea.fechaEntrega).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEliminar("tarea", tarea.id)}
                        disabled={loading}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Grabaciones */}
        {activeTab === "grabaciones" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grabaciones disponibles</h2>
              <button
                onClick={() => setModalCrear("grabacion")}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-sm font-medium transition"
              >
                <Plus className="h-4 w-4" /> Nueva grabación
              </button>
            </div>

            {clase.grabaciones.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No hay grabaciones aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clase.grabaciones.map(grabacion => (
                  <div key={grabacion.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{grabacion.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(grabacion.fecha).toLocaleDateString()}
                          {grabacion.duracionMin && ` • ${grabacion.duracionMin} min`}
                        </p>
                        <a
                          href={grabacion.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Ver grabación
                        </a>
                      </div>
                      <button
                        onClick={() => handleEliminar("grabacion", grabacion.id)}
                        disabled={loading}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Miembros */}
        {activeTab === "miembros" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Miembros ({miembrosActuales.length})
              </h2>
              {clase.googleCourseId && (
                <button
                  onClick={async () => {
                    setSincronizando(true);
                    try {
                      const res = await fetch("/api/classroom/sync-miembros", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ claseId }),
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        Toast.error("Error", data.error || "Error al sincronizar");
                        return;
                      }

                      // Recargar miembros
                      const miembrosRes = await fetch(`/api/classroom/miembros?claseId=${claseId}`);
                      const miembrosData = await miembrosRes.json();

                      if (miembrosRes.ok) {
                        setMiembrosActuales(miembrosData.miembros || []);
                      }

                      Toast.success(
                        "Sincronización exitosa",
                        `Creados: ${data.sincronizacion.creados.length}, Vinculados: ${data.sincronizacion.vinculados.length}`
                      );
                    } catch (err) {
                      Toast.error("Error", "Error de conexión");
                    } finally {
                      setSincronizando(false);
                    }
                  }}
                  disabled={sincronizando}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 font-medium transition text-sm"
                >
                  {sincronizando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sincronizando ? "Sincronizando..." : "Sincronizar con Google"}
                </button>
              )}
            </div>

            {miembrosActuales.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No hay miembros aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {miembrosActuales.map(miembro => (
                  <div key={miembro.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-start gap-3">
                      {miembro.imagen && (
                        <Image
                          src={miembro.imagen}
                          alt={miembro.nombre}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{miembro.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{miembro.email}</p>
                        {miembro.grado && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Grado {miembro.grado}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalCrear === "evento" && "Nuevo evento"}
                {modalCrear === "tarea" && "Nueva tarea"}
                {modalCrear === "grabacion" && "Nueva grabación"}
              </h3>
              <button
                onClick={() => setModalCrear(null)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos comunes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Campos específicos por tipo */}
              {modalCrear === "evento" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CLASE">Clase</option>
                      <option value="TAREA">Tarea</option>
                      <option value="EXAMEN">Examen</option>
                      <option value="EVENTO">Evento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha y hora de inicio
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link de Google Meet (opcional)
                    </label>
                    <input
                      type="url"
                      name="linkMeet"
                      value={formData.linkMeet}
                      onChange={handleInputChange}
                      placeholder="https://meet.google.com/..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {modalCrear === "tarea" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link de la tarea (opcional)
                    </label>
                    <input
                      type="url"
                      name="linkUrl"
                      value={formData.linkUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de entrega (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaEntrega"
                      value={formData.fechaEntrega}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Puntos posibles (opcional)
                    </label>
                    <input
                      type="number"
                      name="puntosPosibles"
                      value={formData.puntosPosibles}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {modalCrear === "grabacion" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link de la grabación *
                    </label>
                    <input
                      type="url"
                      name="linkUrl"
                      value={formData.linkUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Materia (opcional)
                    </label>
                    <input
                      type="text"
                      name="materia"
                      value={formData.materia}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de grabación *
                    </label>
                    <input
                      type="datetime-local"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duración en minutos (opcional)
                    </label>
                    <input
                      type="number"
                      name="duracionMin"
                      value={formData.duracionMin}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalCrear(null)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 font-medium text-white transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
