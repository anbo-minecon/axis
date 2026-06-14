"use client";

// app/admin/classroom/page.tsx
// Panel principal de Classroom para administrador
// Muestra estado de conexión, clases y accesos rápidos a submódulos

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Plus, Calendar, Video, BookOpen,
  Users, RefreshCw, CheckCircle2, AlertTriangle,
  ExternalLink, Loader, ChevronRight, Wifi, WifiOff,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface Clase {
  id:            string;
  nombre:        string;
  materia:       string | null;
  seccion:       string | null;
  estado:        string;
  enlaceAlternativo: string | null;
  docente:       { nombre: string | null; imagen: string | null } | null;
  grupo:         { nombre: string } | null;
  _count:        { grabaciones: number; tareas: number; eventos: number };
}

// ── Colores por materia ───────────────────────────────────────────────────────
const MATERIA_COLOR: Record<string, string> = {
  "Matemáticas":        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Lectura Crítica":    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Ciencias Naturales": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Sociales":           "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Inglés":             "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
};

function getColorMateria(materia: string | null) {
  if (!materia) return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  return MATERIA_COLOR[materia] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

// ── Componente: Card de clase ─────────────────────────────────────────────────
function ClaseCard({ clase }: { clase: Clase }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
            {clase.nombre}
          </h3>
          {clase.seccion && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{clase.seccion}</p>
          )}
        </div>
        <span className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-medium ${getColorMateria(clase.materia)}`}>
          {clase.materia ?? "Sin materia"}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Video className="h-3.5 w-3.5" />
          {clase._count.grabaciones} grabaciones
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {clase._count.tareas} tareas
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {clase._count.eventos} eventos
        </span>
      </div>

      {/* Info grupo/docente */}
      {(clase.grupo || clase.docente) && (
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 dark:text-gray-500">
          {clase.grupo && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {clase.grupo.nombre}
            </span>
          )}
          {clase.docente?.nombre && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> {clase.docente.nombre}
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/classroom/clases/${clase.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 transition"
        >
          Gestionar <ChevronRight className="h-3 w-3" />
        </Link>
        {clase.enlaceAlternativo && (
          <a
            href={clase.enlaceAlternativo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
function ClassroomAdminContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clases, setClases]         = useState<Clase[]>([]);
  const [loading, setLoading]       = useState(true);
  const [conectado, setConectado]   = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando]       = useState(false);

  // Form nueva clase
  const [nombre, setNombre]         = useState("");
  const [seccion, setSeccion]       = useState("");
  const [materia, setMateria]       = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    // Notificaciones desde query params (callback OAuth)
    const connected = searchParams.get("connected");
    const error     = searchParams.get("error");
    if (connected === "true") Toast.success("Classroom conectado", "Tu cuenta de Google Classroom está vinculada");
    if (error === "classroom_denied") Toast.error("Acceso denegado", "No se pudo conectar Google Classroom");
    if (error) Toast.error("Error de conexión", "No se pudo completar la conexión con Classroom");
  }, [searchParams]);

  useEffect(() => {
    cargarClases();
  }, []);

  async function cargarClases() {
    setLoading(true);
    try {
      const res = await fetch("/api/classroom/clases");
      const data = await res.json();
      if (res.ok) {
        setClases(data.clases ?? []);
        // Si hay clases, asumimos que hay token conectado
        setConectado(data.clases?.length >= 0);
      }
    } catch {
      Toast.error("Error", "No se pudieron cargar las clases");
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearClase(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCreando(true);
    try {
      const res = await fetch("/api/classroom/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, seccion, materia, descripcion }),
      });

      const data = await res.json();

      if (data.code === "NO_CLASSROOM_TOKEN") {
        Toast.error("Classroom no conectado", "Conecta tu cuenta de Google Classroom primero");
        setCreando(false);
        return;
      }

      if (!res.ok) {
        Toast.error("Error", data.error);
        setCreando(false);
        return;
      }

      Toast.success("Clase creada", `"${nombre}" creada en Google Classroom`);
      setMostrarForm(false);
      setNombre(""); setSeccion(""); setMateria(""); setDescripcion("");
      cargarClases();
    } catch {
      Toast.error("Error", "No se pudo crear la clase");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="min-h-full p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-purple-600" />
            Google Classroom
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona clases, calendario, grabaciones y materiales
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Estado de conexión */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            conectado
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          }`}>
            {conectado
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Conectado</>
              : <><WifiOff className="h-3.5 w-3.5" /> Sin conectar</>
            }
          </div>

          {/* Botón conectar */}
          <a
            href="/api/classroom/connect"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition"
          >
            <Wifi className="h-3.5 w-3.5" />
            {conectado ? "Reconectar" : "Conectar cuenta"}
          </a>

          <button
            onClick={cargarClases}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>

          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva clase
          </button>
        </div>
      </div>

      {/* Accesos rápidos a submódulos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { href: "/admin/classroom/calendario",  label: "Calendario",   icon: Calendar,    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
          { href: "/admin/classroom/grabaciones", label: "Grabaciones",  icon: Video,       color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
          { href: "/admin/classroom/materiales",  label: "Materiales",   icon: BookOpen,    color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
          { href: "/admin/classroom/miembros",    label: "Miembros",     icon: Users,       color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          </Link>
        ))}
      </div>

      {/* Form nueva clase */}
      {mostrarForm && (
        <div className="mb-6 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10 p-5">
          <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-4">
            Nueva clase en Google Classroom
          </h2>
          <form onSubmit={handleCrearClase} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
              <input
                value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Matemáticas 11°A"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sección</label>
              <input
                value={seccion} onChange={e => setSeccion(e.target.value)}
                placeholder="Ej: Grupo A"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Materia</label>
              <select
                value={materia} onChange={e => setMateria(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar</option>
                {["Matemáticas","Lectura Crítica","Ciencias Naturales","Sociales","Inglés"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <input
                value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button
                type="button" onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={creando}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
              >
                {creando && <Loader className="h-4 w-4 animate-spin" />}
                {creando ? "Creando..." : "Crear en Classroom"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de clases */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : clases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No hay clases creadas aún
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Conecta tu cuenta de Google Classroom y crea tu primera clase
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clases.map(c => <ClaseCard key={c.id} clase={c} />)}
        </div>
      )}
    </div>
  );
}

export default function ClassroomAdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader className="h-6 w-6 animate-spin text-gray-400" /></div>}>
      <ClassroomAdminContent />
    </Suspense>
  );
}