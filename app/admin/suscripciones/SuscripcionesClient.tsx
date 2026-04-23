// app/admin/suscripciones/SuscripcionesClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BadgeCheck, Clock, XCircle, Search, ChevronLeft, ChevronRight,
  CheckCircle2, Ban, CalendarPlus, MoreVertical, RefreshCw, X,
  Users, RotateCcw, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tipos ── */
interface Plan    { id: string; nombre: string; precio: number; duracionDias: number }
interface Usuario { id: string; nombre: string; email: string; documento?: string | null; imagen?: string | null }
interface Suscripcion {
  id: string; usuarioId: string; planId: string | null;
  fechaInicio: string | null; fechaFin: string | null; activa: boolean;
  usuario: Usuario; plan: Plan | null;
  tieneSuscripcion: boolean;
}
interface Contadores { todas: number; sinSuscripcion: number; conSuscripcion: number; activas: number; expiradas: number }

type Filtro = "todas" | "sin-suscripcion" | "con-suscripcion" | "activas" | "expiradas";
type Accion = "activar" | "desactivar" | "extender" | "crear" | "aprobar" | "rechazar";

interface Props {
  initialData: Suscripcion[];
  planes: Plan[];
  contadores: Contadores;
}

/* ── Helpers ── */
function fmtFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function diasRestantes(fechaFin: string | null) {
  if (!fechaFin) return 0;
  return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);
}
function estadoSuscripcion(s: Suscripcion): "sin-suscripcion" | "activa" | "expirada" {
  if (!s.tieneSuscripcion || !s.activa) return "sin-suscripcion";
  if (!s.fechaFin) return "sin-suscripcion";
  if (new Date(s.fechaFin) < new Date()) return "expirada";
  return "activa";
}
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

/* ── Badge de estado ── */
function EstadoBadge({ estado }: { estado: "sin-suscripcion" | "activa" | "expirada" }) {
  const cfg = {
    "sin-suscripcion": { cls: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400",       label: "Sin suscripción" },
    activa:    { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "Activa" },
    expirada:  { cls: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",               label: "Expirada" },
  }[estado];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

/* ── Modal de acción ── */
function AccionModal({
  suscripcion,
  accion,
  planes,
  onConfirm,
  onClose,
  loading,
}: {
  suscripcion: Suscripcion;
  accion: Accion;
  planes: Plan[];
  onConfirm: (diasExtra?: number, planId?: string, diasDuracion?: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [dias, setDias] = useState(30);
  const [planSeleccionado, setPlanSeleccionado] = useState(planes[0]?.id ?? "");

  const cfg = {
    activar:     { titulo: "Activar suscripción",    desc: `¿Confirmar activación de ${suscripcion.usuario.nombre}?`,  btn: "Activar",   cls: "bg-emerald-600 hover:bg-emerald-700" },
    desactivar:  { titulo: "Desactivar suscripción", desc: `¿Desactivar la suscripción de ${suscripcion.usuario.nombre}?`, btn: "Desactivar", cls: "bg-red-600 hover:bg-red-700" },
    extender:    { titulo: "Extender suscripción",   desc: `Selecciona los días adicionales para ${suscripcion.usuario.nombre}.`, btn: "Extender", cls: "bg-purple-600 hover:bg-purple-700" },
    crear:       { titulo: "Crear suscripción",      desc: `Asigna un plan a ${suscripcion.usuario.nombre}.`, btn: "Crear", cls: "bg-blue-600 hover:bg-blue-700" },
    aprobar:     { titulo: "Aprobar suscripción",    desc: `Selecciona un plan para aprobar a ${suscripcion.usuario.nombre}.`, btn: "Aprobar", cls: "bg-emerald-600 hover:bg-emerald-700" },
    rechazar:    { titulo: "Rechazar suscripción",   desc: `¿Rechazar y eliminar la solicitud de suscripción de ${suscripcion.usuario.nombre}?`, btn: "Rechazar", cls: "bg-red-600 hover:bg-red-700" },
  }[accion];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{cfg.titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{cfg.desc}</p>

        {/* Info suscripción */}
        {suscripcion.tieneSuscripcion && accion !== "crear" && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3 mb-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Plan</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{suscripcion.plan?.nombre}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Vence</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{fmtFecha(suscripcion.fechaFin)}</span>
            </div>
          </div>
        )}

        {/* Selector de plan para crear y aprobar */}
        {(accion === "crear" || accion === "aprobar") && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">Plan a asignar</label>
            <select
              value={planSeleccionado}
              onChange={(e) => setPlanSeleccionado(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.duracionDias} días - ${p.precio})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input días para extender, crear o aprobar */}
        {(accion === "extender" || accion === "crear" || accion === "aprobar") && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {accion === "extender" ? "Días adicionales" : "Duración (días)"}
            </label>
            <div className="flex items-center gap-2">
              {[15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDias(d)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-semibold border transition",
                    dias === d
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-400"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (accion === "crear" || accion === "aprobar") {
                onConfirm(undefined, planSeleccionado, dias);
              } else if (accion === "extender") {
                onConfirm(dias);
              } else {
                onConfirm();
              }
            }}
            disabled={loading}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2",
              cfg.cls,
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ── */
export function SuscripcionesClient({ initialData, planes, contadores: initialContadores }: Props) {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>(initialData);
  const [contadores, setContadores] = useState(initialContadores);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<{ suscripcion: Suscripcion; accion: Accion } | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "err" } | null>(null);

  /* Fetch */
  const fetchData = useCallback(async (f: Filtro, q: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/suscripciones?filtro=${f}&q=${encodeURIComponent(q)}&page=${p}`
      );
      const data = await res.json();
      setSuscripciones(data.suscripciones);
      setTotalPages(data.pagination.pages || 1);
      setContadores(data.contadores);
    } catch {
      showToast("Error al cargar suscripciones", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(filtro, busqueda, page), 300);
    return () => clearTimeout(t);
  }, [filtro, busqueda, page, fetchData]);

  /* Toast */
  const showToast = (msg: string, tipo: "ok" | "err") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  /* Acción */
  const handleAccion = async (diasExtra?: number, planId?: string, diasDuracion?: number) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      if (modal.accion === "crear" || modal.accion === "aprobar") {
        // POST para crear nueva suscripción (aprobar es igual que crear)
        const res = await fetch("/api/admin/suscripciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            usuarioId: modal.suscripcion.usuarioId, 
            planId, 
            diasDuracion 
          }),
        });
        if (!res.ok) throw new Error();
      } else if (modal.accion === "rechazar") {
        // PATCH para rechazar (eliminar suscripción)
        const res = await fetch("/api/admin/suscripciones", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: modal.suscripcion.id, 
            accion: "rechazar"
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        // PATCH para otras acciones (activar, desactivar, extender)
        const res = await fetch("/api/admin/suscripciones", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: modal.suscripcion.id, 
            accion: modal.accion, 
            diasExtra 
          }),
        });
        if (!res.ok) throw new Error();
      }
      showToast("Acción completada con éxito", "ok");
      setModal(null);
      fetchData(filtro, busqueda, page);
    } catch {
      showToast("Error al ejecutar la acción", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const TABS: { key: Filtro; label: string; icon: React.ElementType; count: number }[] = [
    { key: "todas",           label: "Todos",         icon: Users,      count: contadores.todas },
    { key: "sin-suscripcion", label: "Sin suscripción",icon: Clock,      count: contadores.sinSuscripcion },
    { key: "con-suscripcion", label: "Con suscripción", icon: BadgeCheck, count: contadores.conSuscripcion },
    { key: "activas",         label: "Activas",       icon: CheckCircle2,count: contadores.activas },
    { key: "expiradas",       label: "Expiradas",     icon: XCircle,    count: contadores.expiradas },
  ];

  return (
    <div className="min-h-full p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gestionar Suscripciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Asigna, activa y gestiona suscripciones de estudiantes
          </p>
        </div>
        {contadores.sinSuscripcion > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1">
            <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              {contadores.sinSuscripcion} sin suscripción
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = filtro === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setFiltro(tab.key); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition",
                active
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o documento…"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : suscripciones.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <BadgeCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay suscripciones</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {busqueda ? "Intenta con otra búsqueda" : "No hay resultados para este filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suscripciones.map((s) => {
            const estado = estadoSuscripcion(s);
            const dias = diasRestantes(s.fechaFin);
            return (
              <div
                key={s.id}
                className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 text-sm font-bold text-purple-700 dark:text-purple-300">
                    {getInitials(s.usuario.nombre)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {s.usuario.nombre}
                      </p>
                      <EstadoBadge estado={estado} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {s.usuario.email}
                    </p>

                    {s.tieneSuscripcion ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                          {s.plan?.nombre}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Inicio: {fmtFecha(s.fechaInicio)}
                        </span>
                        <span className={cn(
                          "text-xs font-medium",
                          dias > 15 ? "text-gray-400 dark:text-gray-500"
                            : dias > 0 ? "text-amber-600 dark:text-amber-400"
                            : "text-red-500 dark:text-red-400"
                        )}>
                          {dias > 0 ? `Vence en ${dias}d` : `Venció ${Math.abs(dias)}d atrás`}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        No tiene suscripción activa
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    {s.tieneSuscripcion && s.activa ? (
                      <>
                        {estado === "activa" && (
                          <>
                            <button
                              onClick={() => setModal({ suscripcion: s, accion: "extender" })}
                              title="Extender"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setModal({ suscripcion: s, accion: "desactivar" })}
                              title="Desactivar"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {estado === "expirada" && (
                          <button
                            onClick={() => setModal({ suscripcion: s, accion: "extender" })}
                            title="Renovar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setModal({ suscripcion: s, accion: "aprobar" })}
                          title="Aprobar"
                          className="flex h-8 px-2 items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition text-xs font-semibold"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => setModal({ suscripcion: s, accion: "rechazar" })}
                          title="Rechazar"
                          className="flex h-8 px-2 items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition text-xs font-semibold"
                        >
                          <Ban className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal acción */}
      {modal && (
        <AccionModal
          suscripcion={modal.suscripcion}
          accion={modal.accion}
          planes={planes}
          onConfirm={handleAccion}
          onClose={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 lg:bottom-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all",
          toast.tipo === "ok" ? "bg-emerald-600" : "bg-red-600"
        )}>
          {toast.tipo === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}