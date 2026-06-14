"use client";

// app/admin/classroom/calendario/page.tsx
// Calendario visual — días con puntos de colores, hover preview, click modal

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus,
  Video, BookOpen, AlertCircle, Calendar, X,
  ExternalLink, Clock, Loader, Users,
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  // Padding inicio
  for (let i = 0; i < primero.getDay(); i++) {
    dias.push(new Date(year, month, -i + (primero.getDay() - 1 - i)));
  }
  // Días del mes
  for (let d = 1; d <= ultimo.getDate(); d++) {
    dias.push(new Date(year, month, d));
  }
  // Padding fin
  const restante = 42 - dias.length;
  for (let i = 1; i <= restante; i++) {
    dias.push(new Date(year, month + 1, i));
  }
  return dias.sort((a, b) => a.getTime() - b.getTime());
}

const TIPO_CONFIG = {
  CLASE:  { color: "bg-blue-500",   label: "Clase",  icon: Video,         dot: "bg-blue-500"   },
  TAREA:  { color: "bg-amber-500",  label: "Tarea",  icon: BookOpen,      dot: "bg-amber-500"  },
  EXAMEN: { color: "bg-red-500",    label: "Examen", icon: AlertCircle,   dot: "bg-red-500"    },
  EVENTO: { color: "bg-green-500",  label: "Evento", icon: Calendar,      dot: "bg-green-500"  },
};

// ── Modal de creación ──────────────────────────────────────────────────────────
function ModalCrear({ fecha, onClose, onCreado }: { fecha: Date; onClose: () => void; onCreado: () => void }) {
  const [clases, setClases]       = useState<{ id: string; nombre: string }[]>([]);
  const [claseId, setClaseId]     = useState("");
  const [titulo, setTitulo]       = useState("");
  const [tipo, setTipo]           = useState<"CLASE"|"TAREA"|"EXAMEN"|"EVENTO">("CLASE");
  const [hora, setHora]           = useState("08:00");
  const [horaFin, setHoraFin]     = useState("09:00");
  const [linkMeet, setLinkMeet]   = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    fetch("/api/classroom/clases").then(r => r.json()).then(d => setClases(d.clases ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!claseId || !titulo.trim()) return;
    setLoading(true);

    const fi = new Date(fecha);
    const [h, m] = hora.split(":").map(Number);
    fi.setHours(h, m, 0, 0);
    const ff = new Date(fecha);
    const [hf, mf] = horaFin.split(":").map(Number);
    ff.setHours(hf, mf, 0, 0);

    try {
      const res = await fetch("/api/classroom/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claseId, titulo, tipo,
          fechaInicio: fi.toISOString(),
          fechaFin:    ff.toISOString(),
          linkMeet:    linkMeet || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      Toast.success("Evento creado", titulo);
      onCreado();
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Nuevo evento — {fecha.toLocaleDateString("es-CO", { weekday:"long", day:"2-digit", month:"long" })}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Clase *</label>
            <select value={claseId} onChange={e => setClaseId(e.target.value)} required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Seleccionar clase</option>
              {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required
              placeholder="Ej: Clase de álgebra"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as any)}
                className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="CLASE">Clase</option>
                <option value="TAREA">Tarea</option>
                <option value="EXAMEN">Examen</option>
                <option value="EVENTO">Evento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Inicio</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fin</label>
              <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Link Meet (opcional)</label>
            <input value={linkMeet} onChange={e => setLinkMeet(e.target.value)} type="url"
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50">
              {loading && <Loader className="h-3.5 w-3.5 animate-spin" />} Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal detalle evento ───────────────────────────────────────────────────────
function ModalDetalle({ evento, onClose }: { evento: Evento; onClose: () => void }) {
  const cfg = TIPO_CONFIG[evento.tipo];
  const Icon = cfg.icon;
  const fi   = new Date(evento.fechaInicio);
  const ff   = evento.fechaFin ? new Date(evento.fechaFin) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-5"
        onClick={e => e.stopPropagation()}>
        {/* Tipo badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" /> {cfg.label}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Título y clase */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{evento.titulo}</h3>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">{evento.clase.nombre}</p>
        {evento.clase.materia && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{evento.clase.materia}</p>
        )}

        {/* Fecha y hora */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 text-gray-400" />
            {fi.toLocaleDateString("es-CO", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 text-gray-400" />
            {fi.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}
            {ff && ` — ${ff.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}`}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cerrar
          </button>
          {evento.linkMeet && (
            <a href={evento.linkMeet} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
              <ExternalLink className="h-4 w-4" /> Unirse
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tooltip hover ──────────────────────────────────────────────────────────────
function TooltipEventos({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-48 rounded-xl bg-gray-900 dark:bg-gray-950 shadow-xl border border-gray-700 p-2 pointer-events-none">
      <div className="space-y-1.5">
        {eventos.slice(0, 4).map(ev => {
          const cfg  = TIPO_CONFIG[ev.tipo];
          const Icon = cfg.icon;
          return (
            <div key={ev.id} className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
              <span className="text-[11px] text-gray-200 truncate">{ev.titulo}</span>
            </div>
          );
        })}
        {eventos.length > 4 && (
          <p className="text-[10px] text-gray-500 pl-3.5">+{eventos.length - 4} más</p>
        )}
      </div>
      {/* Flecha */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-950" />
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function CalendarioAdminPage() {
  const hoy = new Date();
  const [fecha, setFecha]           = useState(new Date());
  const [eventos, setEventos]       = useState<Evento[]>([]);
  const [loading, setLoading]       = useState(true);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [modalCrear, setModalCrear] = useState<Date | null>(null);
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

  function eventosDelDia(dia: Date): Evento[] {
    return eventos.filter(e => isSameDay(new Date(e.fechaInicio), dia));
  }

  const esMesActual = (dia: Date) => dia.getMonth() === month;

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/classroom"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-1 transition">
            <ArrowLeft className="h-4 w-4" /> Classroom
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
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
      <div className="flex flex-wrap gap-3 mb-4">
        {(Object.entries(TIPO_CONFIG) as [keyof typeof TIPO_CONFIG, typeof TIPO_CONFIG[keyof typeof TIPO_CONFIG]][]).map(([tipo, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={tipo} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          );
        })}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Click en un día para agregar evento
        </span>
      </div>

      {/* Calendario */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          {/* Cabecera días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7">
            {dias.map((dia, i) => {
              const evs       = eventosDelDia(dia);
              const esHoy     = isSameDay(dia, hoy);
              const esMes     = esMesActual(dia);
              const dayKey    = dia.toISOString().split("T")[0];
              const isHovered = hoveredDay === dayKey;

              return (
                <div key={i}
                  className={`relative min-h-[80px] p-2 border-b border-r border-gray-50 dark:border-gray-700/50 cursor-pointer transition-colors group
                    ${!esMes ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}
                    ${esHoy  ? "bg-blue-50/60 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"}
                  `}
                  onClick={() => setModalCrear(dia)}
                  onMouseEnter={() => evs.length > 0 && setHoveredDay(dayKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Número del día */}
                  <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition
                    ${esHoy
                      ? "bg-purple-600 text-white"
                      : esMes
                        ? "text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}>
                    {dia.getDate()}
                  </div>

                  {/* Puntos de eventos */}
                  {evs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 px-0.5">
                      {evs.slice(0, 3).map(ev => (
                        <button
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setModalDetalle(ev); }}
                          className={`h-1.5 w-1.5 rounded-full ${TIPO_CONFIG[ev.tipo].dot} hover:scale-150 transition-transform`}
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

                  {/* Etiquetas de eventos en días con pocos */}
                  {evs.length > 0 && evs.length <= 2 && (
                    <div className="mt-1 space-y-0.5">
                      {evs.map(ev => {
                        const cfg  = TIPO_CONFIG[ev.tipo];
                        const Icon = cfg.icon;
                        return (
                          <button key={ev.id}
                            onClick={e => { e.stopPropagation(); setModalDetalle(ev); }}
                            className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate ${cfg.color} hover:opacity-90 transition`}>
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{ev.titulo}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tooltip hover */}
                  {isHovered && evs.length > 0 && (
                    <TooltipEventos eventos={evs} />
                  )}

                  {/* Botón + en hover */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                    <div className="h-4 w-4 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <Plus className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen del mes */}
      {!loading && eventos.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Este mes — {eventos.length} eventos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["CLASE","TAREA","EXAMEN","EVENTO"] as const).map(tipo => {
              const count = eventos.filter(e => e.tipo === tipo).length;
              const cfg   = TIPO_CONFIG[tipo];
              const Icon  = cfg.icon;
              return (
                <div key={tipo} className="flex items-center gap-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2">
                  <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{cfg.label}s</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modales */}
      {modalCrear && (
        <ModalCrear
          fecha={modalCrear}
          onClose={() => setModalCrear(null)}
          onCreado={cargar}
        />
      )}
      {modalDetalle && (
        <ModalDetalle
          evento={modalDetalle}
          onClose={() => setModalDetalle(null)}
        />
      )}
    </div>
  );
}