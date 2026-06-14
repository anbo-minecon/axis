"use client";

// app/admin/classroom/clases/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Video, BookOpen, Users, Plus,
  ExternalLink, Trash2, Loader, Calendar,
  Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface Clase {
  id: string; nombre: string; materia: string | null;
  seccion: string | null; descripcion: string | null;
  enlaceAlternativo: string | null; estado: string;
  docente: { nombre: string | null } | null;
  grupo: { nombre: string } | null;
}
interface Grabacion {
  id: string; titulo: string; linkUrl: string;
  materia: string | null; fecha: string; duracionMin: number | null;
}
interface Tarea {
  id: string; titulo: string; descripcion: string | null;
  linkUrl: string | null; fechaEntrega: string | null;
  puntosPosibles: number | null; estado: string;
}

type Tab = "grabaciones" | "tareas" | "miembros";

export default function DetalleClasePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [clase, setClase]           = useState<Clase | null>(null);
  const [tab, setTab]               = useState<Tab>("grabaciones");
  const [grabaciones, setGrabaciones] = useState<Grabacion[]>([]);
  const [tareas, setTareas]         = useState<Tarea[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showFormGrab, setShowFormGrab] = useState(false);
  const [showFormTarea, setShowFormTarea] = useState(false);

  // Form grabación
  const [gTitulo, setGTitulo]   = useState("");
  const [gLink, setGLink]       = useState("");
  const [gFecha, setGFecha]     = useState(new Date().toISOString().split("T")[0]);
  const [gDuracion, setGDuracion] = useState("");
  const [savingG, setSavingG]   = useState(false);

  // Form tarea
  const [tTitulo, setTTitulo]   = useState("");
  const [tDesc, setTDesc]       = useState("");
  const [tLink, setTLink]       = useState("");
  const [tFecha, setTFecha]     = useState("");
  const [tPuntos, setTPuntos]   = useState("100");
  const [savingT, setSavingT]   = useState(false);

  useEffect(() => { cargarClase(); }, [id]);
  useEffect(() => {
    if (tab === "grabaciones") cargarGrabaciones();
    if (tab === "tareas")      cargarTareas();
  }, [tab, id]);

  async function cargarClase() {
    setLoading(true);
    try {
      const [claseRes, grabRes, tareaRes] = await Promise.all([
        fetch(`/api/classroom/clases`),
        fetch(`/api/classroom/grabaciones?claseId=${id}`),
        fetch(`/api/classroom/tareas?claseId=${id}`),
      ]);
      const claseData  = await claseRes.json();
      const grabData   = await grabRes.json();
      const tareaData  = await tareaRes.json();

      const found = (claseData.clases ?? []).find((c: Clase) => c.id === id);
      setClase(found ?? null);
      setGrabaciones(grabData.grabaciones ?? []);
      setTareas(tareaData.tareas ?? []);
    } catch {
      Toast.error("Error", "No se pudo cargar la clase");
    } finally {
      setLoading(false);
    }
  }

  async function cargarGrabaciones() {
    const res  = await fetch(`/api/classroom/grabaciones?claseId=${id}`);
    const data = await res.json();
    setGrabaciones(data.grabaciones ?? []);
  }

  async function cargarTareas() {
    const res  = await fetch(`/api/classroom/tareas?claseId=${id}`);
    const data = await res.json();
    setTareas(data.tareas ?? []);
  }

  async function handleCrearGrabacion(e: React.FormEvent) {
    e.preventDefault();
    setSavingG(true);
    try {
      const res = await fetch("/api/classroom/grabaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claseId: id, titulo: gTitulo, linkUrl: gLink,
          fecha: new Date(gFecha).toISOString(),
          duracionMin: gDuracion ? parseInt(gDuracion) : undefined,
          materia: clase?.materia,
        }),
      });
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      Toast.success("Grabación agregada", gTitulo);
      setShowFormGrab(false);
      setGTitulo(""); setGLink(""); setGDuracion("");
      cargarGrabaciones();
    } finally { setSavingG(false); }
  }

  async function handleCrearTarea(e: React.FormEvent) {
    e.preventDefault();
    setSavingT(true);
    try {
      const res = await fetch("/api/classroom/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claseId: id, titulo: tTitulo, descripcion: tDesc,
          linkUrl: tLink || undefined,
          fechaEntrega: tFecha ? new Date(tFecha).toISOString() : undefined,
          puntos: tPuntos ? parseFloat(tPuntos) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      Toast.success("Tarea creada", tTitulo);
      setShowFormTarea(false);
      setTTitulo(""); setTDesc(""); setTLink(""); setTFecha("");
      cargarTareas();
    } finally { setSavingT(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full py-20">
        <Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!clase) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Clase no encontrada</p>
        <Link href="/admin/classroom" className="text-purple-600 text-sm mt-2 inline-block">
          ← Volver
        </Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "grabaciones", label: "Grabaciones", icon: Video },
    { key: "tareas",      label: "Tareas",      icon: BookOpen },
    { key: "miembros",    label: "Miembros",    icon: Users },
  ];

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/classroom"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-3 transition">
          <ArrowLeft className="h-4 w-4" /> Volver a Classroom
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{clase.nombre}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {clase.materia  && <span className="text-purple-600 dark:text-purple-400 font-medium">{clase.materia}</span>}
              {clase.seccion  && <span>· {clase.seccion}</span>}
              {clase.docente  && <span>· {clase.docente.nombre}</span>}
              {clase.grupo    && <span>· Grupo: {clase.grupo.nombre}</span>}
            </div>
            {clase.descripcion && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{clase.descripcion}</p>
            )}
          </div>
          {clase.enlaceAlternativo && (
            <a href={clase.enlaceAlternativo} target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ExternalLink className="h-3.5 w-3.5" /> Ver en Classroom
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === key
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Grabaciones ── */}
      {tab === "grabaciones" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowFormGrab(v => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold transition">
              <Plus className="h-3.5 w-3.5" /> Agregar grabación
            </button>
          </div>

          {showFormGrab && (
            <form onSubmit={handleCrearGrabacion}
              className="mb-5 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10 p-4 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input value={gTitulo} onChange={e => setGTitulo(e.target.value)} required
                  placeholder="Ej: Clase 1 — Introducción"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Link de grabación *</label>
                <input value={gLink} onChange={e => setGLink(e.target.value)} required type="url"
                  placeholder="https://drive.google.com/... o YouTube"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                <input type="date" value={gFecha} onChange={e => setGFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (min)</label>
                <input type="number" value={gDuracion} onChange={e => setGDuracion(e.target.value)}
                  placeholder="90"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFormGrab(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={savingG}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50">
                  {savingG && <Loader className="h-3.5 w-3.5 animate-spin" />} Guardar
                </button>
              </div>
            </form>
          )}

          {grabaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay grabaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grabaciones.map(g => (
                <div key={g.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                      <Video className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{g.titulo}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(g.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {g.duracionMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {g.duracionMin} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a href={g.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tareas ── */}
      {tab === "tareas" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowFormTarea(v => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold transition">
              <Plus className="h-3.5 w-3.5" /> Nueva tarea
            </button>
          </div>

          {showFormTarea && (
            <form onSubmit={handleCrearTarea}
              className="mb-5 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10 p-4 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input value={tTitulo} onChange={e => setTTitulo(e.target.value)} required
                  placeholder="Ej: Taller de funciones"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea value={tDesc} onChange={e => setTDesc(e.target.value)} rows={2}
                  placeholder="Instrucciones de la tarea..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Link (opcional)</label>
                <input value={tLink} onChange={e => setTLink(e.target.value)} type="url"
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Puntos</label>
                <input type="number" value={tPuntos} onChange={e => setTPuntos(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de entrega</label>
                <input type="date" value={tFecha} onChange={e => setTFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFormTarea(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={savingT}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50">
                  {savingT && <Loader className="h-3.5 w-3.5 animate-spin" />} Crear tarea
                </button>
              </div>
            </form>
          )}

          {tareas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay tareas asignadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map(t => (
                <div key={t.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.titulo}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t.fechaEntrega && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Entrega: {new Date(t.fechaEntrega).toLocaleDateString("es-CO")}
                          </span>
                        )}
                        {t.puntosPosibles && (
                          <span>{t.puntosPosibles} pts</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          t.estado === "ASIGNADA"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>{t.estado}</span>
                      </div>
                    </div>
                  </div>
                  {t.linkUrl && (
                    <a href={t.linkUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Miembros ── */}
      {tab === "miembros" && (
        <Link href={`/admin/classroom/miembros?claseId=${id}`}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-12 text-sm text-gray-400 dark:text-gray-500 hover:border-purple-400 hover:text-purple-600 transition">
          <Users className="h-5 w-5" /> Gestionar miembros de esta clase →
        </Link>
      )}
    </div>
  );
}