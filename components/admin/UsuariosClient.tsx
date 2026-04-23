// components/admin/UsuariosClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Loader,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tipos ── */
interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: "ESTUDIANTE" | "DOCENTE" | "ADMIN";
  activo: boolean;
  createdAt: string;
  suscripcion?: { activa: boolean; plan?: { nombre: string } } | null;
}

interface Stats {
  total: number;
  estudiantes: number;
  docentes: number;
  conSuscripcion: number;
}

// NUNCA incluir DEVELOPER
const ROLES_OPCIONES = [
  { value: "", label: "Todos los roles" },
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "DOCENTE", label: "Docente" },
  { value: "ADMIN", label: "Administrador" },
];

const ROL_BADGE: Record<string, string> = {
  ESTUDIANTE: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  DOCENTE:    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  ADMIN:      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

/* ── Modal crear/editar usuario ── */
function UsuarioModal({
  onClose,
  onSaved,
  editando,
}: {
  onClose: () => void;
  onSaved: () => void;
  editando?: UsuarioRow;
}) {
  const [nombre, setNombre] = useState(editando?.nombre ?? "");
  const [email, setEmail] = useState(editando?.email ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>(editando?.rol ?? "ESTUDIANTE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !email.trim()) {
      setError("Nombre y correo son obligatorios");
      return;
    }
    if (!editando && password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editando
            ? { id: editando.id, nombre, email, rol }
            : { nombre, email, password, rol }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {editando ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ana Sofía Ríos"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@email.com"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            />
          </div>

          {!editando && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Rol
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            >
              {/* Nunca mostrar DEVELOPER */}
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DOCENTE">Docente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {editando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tabla de usuarios ── */
export function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, estudiantes: 0, docentes: 0, conSuscripcion: 0 });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<UsuarioRow | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: busqueda,
        rol: filtroRol,
        estado: filtroEstado,
        page: String(page),
      });
      const res = await fetch(`/api/admin/usuarios?${params}`);
      const data = await res.json();
      setUsuarios(data.usuarios ?? []);
      setStats(data.stats ?? { total: 0, estudiantes: 0, docentes: 0, conSuscripcion: 0 });
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      console.error("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroRol, filtroEstado, page]);

  useEffect(() => {
    const t = setTimeout(fetchUsuarios, 300);
    return () => clearTimeout(t);
  }, [fetchUsuarios]);

  const handleToggleActivo = async (usuario: UsuarioRow) => {
    setTogglingId(usuario.id);
    try {
      await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: usuario.id, activo: !usuario.activo }),
      });
      fetchUsuarios();
    } finally {
      setTogglingId(null);
    }
  };

  const abrirEditar = (u: UsuarioRow) => {
    setEditando(u);
    setModalAbierto(true);
  };

  const abrirNuevo = () => {
    setEditando(undefined);
    setModalAbierto(true);
  };

  return (
    <>
      {/* Modal */}
      {modalAbierto && (
        <UsuarioModal
          onClose={() => setModalAbierto(false)}
          onSaved={fetchUsuarios}
          editando={editando}
        />
      )}

      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} usuarios registrados en el sistema.
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Rol - sin DEVELOPER */}
          <select
            value={filtroRol}
            onChange={(e) => { setFiltroRol(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {ROLES_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-gray-700 dark:text-gray-200" },
            { label: "Estudiantes", value: stats.estudiantes, color: "text-blue-600 dark:text-blue-400" },
            { label: "Docentes", value: stats.docentes, color: "text-green-600 dark:text-green-400" },
            { label: "Con suscripción", value: stats.conSuscripcion, color: "text-purple-600 dark:text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No se encontraron usuarios</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suscripción</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    {/* Usuario */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300">
                          {getInitials(u.nombre)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{u.nombre}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ROL_BADGE[u.rol] ?? "bg-gray-100 text-gray-600")}>
                        {u.rol.charAt(0) + u.rol.slice(1).toLowerCase()}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.activo ? "bg-green-500" : "bg-gray-300")} />
                        <span className={cn("text-xs", u.activo ? "text-green-600 dark:text-green-400" : "text-gray-400")}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>

                    {/* Suscripción */}
                    <td className="px-4 py-3">
                      {u.suscripcion ? (
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          u.suscripcion.activa
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        )}>
                          {u.suscripcion.activa ? "⊕ Activa" : "⊗ Inactiva"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Registro */}
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActivo(u)}
                          disabled={togglingId === u.id}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-semibold transition",
                            u.activo
                              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                              : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100",
                            "disabled:opacity-50"
                          )}
                        >
                          {togglingId === u.id ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : u.activo ? (
                            "Desactivar"
                          ) : (
                            "Activar"
                          )}
                        </button>
                        <button
                          onClick={() => abrirEditar(u)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-600 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Necesario para el mensaje vacío
function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}