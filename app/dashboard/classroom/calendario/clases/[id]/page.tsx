"use client";

// app/dashboard/classroom/clases/[id]/page.tsx
// Tablón de la clase para ESTUDIANTES
// Anuncios y tareas extraídos EN TIEMPO REAL desde Google Classroom API
// Imágenes y adjuntos se sirven directamente desde Google — no se guardan en BD

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Megaphone, BookOpen, ExternalLink,
  FileText, Youtube, Link2, Loader, RefreshCw,
  Calendar, Trophy, Image as ImageIcon,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface Material {
  tipo:      "drive" | "youtube" | "link" | "form";
  titulo:    string | null;
  url:       string;
  miniatura: string | null;
}

interface Anuncio {
  id:            string;
  texto:         string;
  linkAlternativo: string;
  fechaCreacion: string;
  materiales:    Material[];
}

interface Tarea {
  id:            string;
  titulo:        string;
  descripcion:   string | null;
  tipo:          string;
  linkAlternativo: string;
  fechaEntrega:  string | null;
  horaEntrega:   string | null;
  puntos:        number | null;
  materiales:    Material[];
}

interface Clase {
  id:              string;
  nombre:          string;
  materia:         string | null;
  googleCourseId:  string;
  enlaceAlternativo: string | null;
  docente:         { nombre: string | null } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function diasRestantes(fecha: string): { texto: string; urgente: boolean } {
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return { texto: "Vencida",  urgente: true };
  if (diff === 0) return { texto: "Hoy",      urgente: true };
  if (diff === 1) return { texto: "Mañana",   urgente: true };
  return { texto: `${diff} días`, urgente: diff <= 3 };
}

// ── Chip de material adjunto ───────────────────────────────────────────────────
function MaterialChip({ m }: { m: Material }) {
  const icons = {
    drive:   <FileText className="h-3.5 w-3.5 text-blue-500" />,
    youtube: <Youtube  className="h-3.5 w-3.5 text-red-500"  />,
    link:    <Link2    className="h-3.5 w-3.5 text-gray-500" />,
    form:    <FileText className="h-3.5 w-3.5 text-green-500"/>,
  };

  return (
    <a href={m.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition group max-w-xs">
      {/* Miniatura si existe */}
      {m.miniatura ? (
        <img src={m.miniatura} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center shrink-0">
          {icons[m.tipo]}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition">
          {m.titulo ?? m.url}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{m.tipo}</p>
      </div>
      <ExternalLink className="h-3 w-3 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-purple-500 transition" />
    </a>
  );
}

// ── Card de Anuncio ───────────────────────────────────────────────────────────
function CardAnuncio({ anuncio }: { anuncio: Anuncio }) {
  const [expandido, setExpandido] = useState(false);
  const textoCorto = anuncio.texto.length > 200 && !expandido;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatFecha(anuncio.fechaCreacion)}
            </span>
            <a href={anuncio.linkAlternativo} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition">
              <ExternalLink className="h-3 w-3" /> Ver en Classroom
            </a>
          </div>
          <p className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line ${textoCorto ? "line-clamp-4" : ""}`}>
            {anuncio.texto}
          </p>
          {anuncio.texto.length > 200 && (
            <button onClick={() => setExpandido(v => !v)}
              className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:underline">
              {expandido ? "Ver menos" : "Ver más"}
            </button>
          )}

          {/* Materiales adjuntos con imágenes de Google */}
          {anuncio.materiales.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {anuncio.materiales.map((m, i) => (
                <MaterialChip key={i} m={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card de Tarea ─────────────────────────────────────────────────────────────
function CardTarea({ tarea }: { tarea: Tarea }) {
  const entrega = tarea.fechaEntrega ? diasRestantes(tarea.fechaEntrega) : null;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          entrega?.urgente ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"
        }`}>
          <BookOpen className={`h-4 w-4 ${entrega?.urgente ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tarea.titulo}</h3>
            {entrega && (
              <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                entrega.urgente
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {entrega.texto}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-2">
            {tarea.fechaEntrega && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Entrega: {formatFecha(tarea.fechaEntrega)}
                {tarea.horaEntrega && ` ${tarea.horaEntrega}`}
              </span>
            )}
            {tarea.puntos && (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" /> {tarea.puntos} pts
              </span>
            )}
          </div>

          {tarea.descripcion && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
              {tarea.descripcion}
            </p>
          )}

          {/* Materiales adjuntos con imágenes de Google */}
          {tarea.materiales.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tarea.materiales.map((m, i) => (
                <MaterialChip key={i} m={m} />
              ))}
            </div>
          )}

          <a href={tarea.linkAlternativo} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir en Classroom
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TabloClasePage() {
  const { id } = useParams<{ id: string }>();

  const [clase, setClase]         = useState<Clase | null>(null);
  const [anuncios, setAnuncios]   = useState<Anuncio[]>([]);
  const [tareas, setTareas]       = useState<Tarea[]>([]);
  const [tab, setTab]             = useState<"tablon" | "tareas">("tablon");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { cargar(); }, [id]);

  async function cargar(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      // 1. Obtener info de la clase desde nuestra BD
      const claseRes  = await fetch("/api/classroom/clases");
      const claseData = await claseRes.json();
      const found: Clase = (claseData.clases ?? []).find((c: Clase) => c.id === id);
      if (!found) { setLoading(false); setRefreshing(false); return; }
      setClase(found);

      // 2. Traer anuncios y tareas EN TIEMPO REAL desde Google Classroom API
      const feedRes  = await fetch(`/api/classroom/feed?courseId=${found.googleCourseId}&tipo=todo`);
      const feedData = await feedRes.json();
      setAnuncios(feedData.anuncios ?? []);
      setTareas(feedData.tareas   ?? []);
    } catch {
      Toast.error("Error", "No se pudo cargar el contenido");
    } finally { setLoading(false); setRefreshing(false); }
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Clase no encontrada</p>
        <Link href="/dashboard/classroom" className="text-purple-600 text-sm mt-2 inline-block">← Volver</Link>
      </div>
    );
  }

  const tareasUrgentes = tareas.filter(t => {
    if (!t.fechaEntrega) return false;
    const diff = Math.ceil((new Date(t.fechaEntrega).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 3;
  });

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/classroom"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-2 transition">
          <ArrowLeft className="h-4 w-4" /> Mi Classroom
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{clase.nombre}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {clase.materia && <span className="text-purple-600 dark:text-purple-400 font-medium">{clase.materia}</span>}
              {clase.docente?.nombre && <span>· Prof. {clase.docente.nombre}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => cargar(true)} disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            {clase.enlaceAlternativo && (
              <a href={clase.enlaceAlternativo} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition">
                <ExternalLink className="h-3.5 w-3.5" /> Ver en Classroom
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Alerta tareas urgentes */}
      {tareasUrgentes.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {tareasUrgentes.length} tarea{tareasUrgentes.length > 1 ? "s" : ""} con entrega próxima
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
        {[
          { key: "tablon" as const, label: "Tablón", icon: Megaphone, count: anuncios.length },
          { key: "tareas" as const, label: "Tareas", icon: BookOpen,  count: tareas.length  },
        ].map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === key
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            <Icon className="h-4 w-4" /> {label}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === key ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="space-y-3">
        {tab === "tablon" && (
          anuncios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Megaphone className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay anuncios en esta clase</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Los anuncios se cargan directamente desde Google Classroom</p>
            </div>
          ) : (
            anuncios.map(a => <CardAnuncio key={a.id} anuncio={a} />)
          )
        )}

        {tab === "tareas" && (
          tareas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay tareas en esta clase</p>
            </div>
          ) : (
            tareas.map(t => <CardTarea key={t.id} tarea={t} />)
          )
        )}
      </div>
    </div>
  );
}