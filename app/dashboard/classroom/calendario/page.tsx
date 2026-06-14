"use client";

// app/dashboard/classroom/calendario/page.tsx
// Calendario visual para ESTUDIANTES — solo lectura, mismo diseño que admin

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar,
  Video, BookOpen, AlertCircle, ExternalLink,
  Clock, Loader, X,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface Evento {
  id:          string;
  titulo:      string;
  tipo:        "CLASE" | "TAREA" | "EXAMEN" | "EVENTO";
  fechaInicio: string;
  fechaFin:    string | null;
  linkMeet:    string | null;
  completado:  boolean;
  clase:       { nombre: string; materia: string | null };
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function getDiasDelMes(year: number, month: number): Date[] {
  const dias: Date[] = [];
  const primero = new Date(year, month, 1);
  const ultimo  = new Date(year, month + 1, 0);
  for (let i = primero.getDay() - 1; i >= 0; i--) {
    dias.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= ultimo.getDate(); d++) {
    dias.push(new Date(year, month, d));
  }
  const restante = 42 - dias.length;
  for (let i = 1; i <= restante; i++) {
    dias.push(new Date(year, month + 1, i));
  }
  return dias;
}

const TIPO_CONFIG = {
  CLASE:  { color: "bg-blue-500",  dot: "bg-blue-500",  label: "Clase",  icon: Video        },
  TAREA:  { color: "bg-amber-500", dot: "bg-amber-500", label: "Tarea",  icon: BookOpen     },
  EXAMEN: { color: "bg-red-500",   dot: "bg-red-500",   label: "Examen", icon: AlertCircle  },
  EVENTO: { color: "bg-green-500", dot: "bg-green-500", label: "Evento", icon: Calendar     },
};

function ModalDetalle({ evento, onClose }: { evento: Evento; onClose: () => void }) {
  const cfg  = TIPO_CONFIG[evento.tipo];
  const Icon = cfg.icon;
  const fi   = new Date(evento.fechaInicio);
  const ff   = evento.fechaFin ? new Date(evento.fechaFin) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-5"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" /> {cfg.label}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{evento.titulo}</h3>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">{evento.clase.nombre}</p>
        {evento.clase.materia && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{evento.clase.materia}</p>
        )}

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            {fi.toLocaleDateString("es-CO", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            {fi.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}
            {ff && ` — ${ff.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}`}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cerrar
          </button>
          {evento.linkMeet && (
            <a href={evento.linkMeet} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
              <ExternalLink className="h-4 w-4" /> Unirse al Meet
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TooltipEventos({ eventos }: { eventos: Evento[] }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-44 rounded-xl bg-gray-900 dark:bg-gray-950 shadow-xl border border-gray-700 p-2 pointer-events-none">
      <div className="space-y-1.5">
        {eventos.slice(0, 4).map(ev => (
          <div key={ev.id} className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${TIPO_CONFIG[ev.tipo].dot}`} />
            <span className="text-[11px] text-gray-200 truncate">{ev.titulo}</span>
          </div>
        ))}
        {eventos.length > 4 && (
          <p className="text-[10px] text-gray-500 pl-3.5">+{eventos.length - 4} más</p>
        )}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950" />
    </div>
  );
}

export default function CalendarioEstudiantePage() {
  const hoy = new Date();
  const [fecha, setFecha]               = useState(new Date());
  const [eventos, setEventos]           = useState<Evento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [hoveredDay, setHoveredDay]     = useState<string | null>(null);
  const [modalDetalle, setModalDetalle] = useState<Evento | null>(null);

  const year  = fecha.getFullYear();
  const month = fecha.getMonth();
  const dias  = getDiasDelMes(year, month);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const desde = new Date(year, month, 1).toISOString();
      const hasta = new Date(year, month + 1, 0).toISOString();
      const res   = await fetch(`/api/classroom/calendario?desde=${desde}&hasta=${hasta}`);
      const data  = await res.json();
      setEventos(data.eventos ?? []);
    } catch {
      Toast.error("Error", "No se pudieron cargar los eventos");
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { cargar(); }, [cargar]);

  function eventosDelDia(dia: Date) {
    return eventos.filter(e => isSameDay(new Date(e.fechaInicio), dia));
  }

  // Próximos eventos desde hoy
  const proximos = eventos
    .filter(e => new Date(e.fechaInicio) >= hoy)
    .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/classroom"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-1 transition">
            <ArrowLeft className="h-4 w-4" /> Mi Classroom
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {MESES[month]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFecha(new Date())}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition font-medium">
            Hoy
          </button>
          <button onClick={() => setFecha(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setFecha(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4">
        {(Object.entries(TIPO_CONFIG) as any[]).map(([tipo, cfg]: any) => (
          <div key={tipo} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendario */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              {/* Cabecera */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7">
                {dias.map((dia, i) => {
                  const evs       = eventosDelDia(dia);
                  const esHoy     = isSameDay(dia, hoy);
                  const esMes     = dia.getMonth() === month;
                  const dayKey    = dia.toISOString().split("T")[0];
                  const isHovered = hoveredDay === dayKey;

                  return (
                    <div key={i}
                      className={`relative min-h-[72px] p-2 border-b border-r border-gray-50 dark:border-gray-700/50
                        ${!esMes ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}
                        ${esHoy  ? "bg-blue-50/60 dark:bg-blue-900/10" : ""}
                        ${evs.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors" : ""}
                      `}
                      onMouseEnter={() => evs.length > 0 && setHoveredDay(dayKey)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Número */}
                      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold
                        ${esHoy
                          ? "bg-blue-600 text-white"
                          : esMes
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-300 dark:text-gray-600"
                        }`}>
                        {dia.getDate()}
                      </div>

                      {/* Puntos */}
                      {evs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 px-0.5">
                          {evs.slice(0, 3).map(ev => (
                            <button key={ev.id}
                              onClick={() => setModalDetalle(ev)}
                              className={`h-2 w-2 rounded-full ${TIPO_CONFIG[ev.tipo].dot} hover:scale-125 transition-transform`}
                              title={ev.titulo}
                            />
                          ))}
                          {evs.length > 3 && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">
                              +{evs.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Etiquetas en días con pocos eventos */}
                      {evs.length > 0 && evs.length <= 2 && esMes && (
                        <div className="mt-1 space-y-0.5">
                          {evs.map(ev => {
                            const cfg  = TIPO_CONFIG[ev.tipo];
                            const Icon = cfg.icon;
                            return (
                              <button key={ev.id}
                                onClick={() => setModalDetalle(ev)}
                                className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate ${cfg.color} hover:opacity-90 transition`}>
                                <Icon className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{ev.titulo}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Tooltip */}
                      {isHovered && evs.length > 0 && <TooltipEventos eventos={evs} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Próximos eventos */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Próximos eventos</h2>
            </div>
            {proximos.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">No hay eventos próximos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {proximos.map(ev => {
                  const cfg  = TIPO_CONFIG[ev.tipo];
                  const Icon = cfg.icon;
                  const fi   = new Date(ev.fechaInicio);
                  return (
                    <button key={ev.id} onClick={() => setModalDetalle(ev)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{ev.titulo}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {fi.toLocaleDateString("es-CO", { weekday:"short", day:"2-digit", month:"short" })}
                          {" · "}
                          {fi.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{ev.clase.nombre}</p>
                      </div>
                      {ev.linkMeet && (
                        <div className="shrink-0 mt-1">
                          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Meet</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen del mes */}
          {!loading && eventos.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                Este mes — {eventos.length} eventos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["CLASE","TAREA","EXAMEN","EVENTO"] as const).map(tipo => {
                  const count = eventos.filter(e => e.tipo === tipo).length;
                  if (count === 0) return null;
                  const cfg = TIPO_CONFIG[tipo];
                  return (
                    <div key={tipo} className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-2.5 py-2">
                      <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{cfg.label}s</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      {modalDetalle && (
        <ModalDetalle evento={modalDetalle} onClose={() => setModalDetalle(null)} />
      )}
    </div>
  );
}