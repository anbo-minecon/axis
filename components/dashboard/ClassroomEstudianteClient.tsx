// components/dashboard/ClassroomEstudianteClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap, Calendar, BookOpen, Video, ExternalLink,
  Clock, AlertCircle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Clase {
  id:                 string;
  nombre:             string;
  descripcion:        string | null;
  materia:            string | null;
  seccion:            string | null;
  enlaceAlternativo:  string | null;
  docente:            { nombre: string | null; imagen: string | null } | null;
  _count:             { eventos: number; tareas: number; grabaciones: number };
}

interface Evento {
  id:          string;
  titulo:      string;
  tipo:        string;
  fechaInicio: Date;
  linkMeet?:   string;
  clase:       { nombre: string; materia: string | null };
}

interface Tarea {
  id:           string;
  titulo:       string;
  estado:       string;
  fechaEntrega: Date | null;
  clase:        { nombre: string; materia: string | null };
}

interface Grabacion {
  id:      string;
  titulo:  string;
  fecha:   Date;
  linkUrl: string;
  clase:   { nombre: string; materia: string | null };
}

interface ClassroomEstudianteClientProps {
  clases:                 Clase[];
  eventosProximos:        Evento[];
  tareasPendientes:       Tarea[];
  grabacionesRecientes:   Grabacion[];
}

export function ClassroomEstudianteClient({
  clases,
  eventosProximos,
  tareasPendientes,
  grabacionesRecientes,
}: ClassroomEstudianteClientProps) {
  const [tab, setTab] = useState<"clases" | "proximos" | "tareas" | "grabaciones">("clases");

  const formatFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-purple-600" />
          Mis Clases de Classroom
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage tus clases, eventos y tareas en un solo lugar
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{clases.length}</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Clases inscritas</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
          <div className="text-2xl font-bold text-purple-400">{eventosProximos.length}</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Eventos próximos</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
          <div className="text-2xl font-bold text-amber-400">{tareasPendientes.length}</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Tareas pendientes</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
          <div className="text-2xl font-bold text-blue-400">{grabacionesRecientes.length}</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Grabaciones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card)]">
        <div className="flex gap-2 p-1 border-b border-white/10">
          {[
            { id: "clases", label: "Clases", count: clases.length, icon: GraduationCap },
            { id: "proximos", label: "Próximos", count: eventosProximos.length, icon: Clock },
            { id: "tareas", label: "Tareas", count: tareasPendientes.length, icon: BookOpen },
            { id: "grabaciones", label: "Grabaciones", count: grabacionesRecientes.length, icon: Video },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition",
                  active
                    ? "bg-purple-600 text-white"
                    : "text-[var(--text-muted)] hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Clases */}
          {tab === "clases" && (
            <div className="space-y-4">
              {clases.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No estás inscrito en clases aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clases.map(clase => (
                    <div
                      key={clase.id}
                      className="rounded-lg border border-white/10 bg-[var(--bg-secondary)] p-4 hover:border-purple-500/50 transition group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{clase.nombre}</h3>
                          {clase.seccion && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{clase.seccion}</p>
                          )}
                        </div>
                        {clase.materia && (
                          <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                            {clase.materia}
                          </span>
                        )}
                      </div>

                      {/* Docente */}
                      {clase.docente && (
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                          {clase.docente.imagen && (
                            <Image
                              src={clase.docente.imagen}
                              alt={clase.docente.nombre || "Docente"}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-xs font-medium text-[var(--text-muted)]">Docente</p>
                            <p className="text-sm text-[var(--text-primary)]">{clase.docente.nombre}</p>
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 mb-4 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {clase._count.eventos} eventos
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {clase._count.tareas} tareas
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" /> {clase._count.grabaciones} grabaciones
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        {clase.enlaceAlternativo && (
                          <a
                            href={clase.enlaceAlternativo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold py-2 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Abrir
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Eventos próximos */}
          {tab === "proximos" && (
            <div className="space-y-3">
              {eventosProximos.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No hay eventos próximos</p>
                </div>
              ) : (
                eventosProximos.map(evento => (
                  <div
                    key={evento.id}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                      <Clock className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{evento.titulo}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {evento.clase.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatFecha(evento.fechaInicio)}
                        </p>
                      </div>
                      {evento.linkMeet && (
                        <a
                          href={evento.linkMeet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Unirse a Meet
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tareas */}
          {tab === "tareas" && (
            <div className="space-y-3">
              {tareasPendientes.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">¡No tienes tareas pendientes!</p>
                </div>
              ) : (
                tareasPendientes.map(tarea => {
                  const diasRestantes = Math.ceil(
                    (new Date(tarea.fechaEntrega!).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                  );
                  const urgente = diasRestantes <= 3;

                  return (
                    <div
                      key={tarea.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4",
                        urgente
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-white/10 bg-[var(--bg-secondary)]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          urgente ? "bg-red-500/20" : "bg-amber-500/20"
                        )}
                      >
                        <AlertCircle
                          className={cn(
                            "h-5 w-5",
                            urgente ? "text-red-400" : "text-amber-400"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">
                          {tarea.titulo}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {tarea.clase.nombre}
                        </p>
                        {tarea.fechaEntrega && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                            <p className="text-xs text-[var(--text-muted)]">
                              Entrega en {diasRestantes} día{diasRestantes !== 1 ? "s" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Grabaciones */}
          {tab === "grabaciones" && (
            <div className="space-y-3">
              {grabacionesRecientes.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No hay grabaciones disponibles</p>
                </div>
              ) : (
                grabacionesRecientes.map(grabacion => (
                  <div
                    key={grabacion.id}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                      <Video className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {grabacion.titulo}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {grabacion.clase.nombre}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {new Date(grabacion.fecha).toLocaleDateString("es-CO")}
                      </p>
                      <a
                        href={grabacion.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver grabación
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-300 text-sm">Tip: Sincronización con Google Classroom</h4>
            <p className="text-xs text-blue-200 mt-1">
              Las clases se sincronizan automáticamente con Google Classroom. Para agregar nuevas grabaciones o tareas, solicita a tu docente que las cargue en el panel de administración.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
