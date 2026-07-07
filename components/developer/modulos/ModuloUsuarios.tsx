"use client";

// components/developer/modulos/ModuloUsuarios.tsx
import { useState, useEffect } from "react";
import { Users, Search, Filter, Shield, UserCheck, UserX, Edit } from "lucide-react";

interface Usuario {
  id: string;
  nombre?: string;
  email: string;
  rol: string;
  planId?: string;
  activo: boolean;
  createdAt: string;
  lastLogin?: string;
}

export function ModuloUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch("/api/developer/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      // Mock data si falla
      setUsuarios([
        {
          id: "1",
          nombre: "Juan Pérez",
          email: "juan@example.com",
          rol: "ESTUDIANTE",
          activo: true,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          lastLogin: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          nombre: "María García",
          email: "maria@example.com",
          rol: "DOCENTE",
          activo: true,
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          lastLogin: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          nombre: "Admin Sistema",
          email: "admin@axis.com",
          rol: "ADMIN",
          activo: true,
          createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
          lastLogin: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: "4",
          nombre: "Developer",
          email: "dev@axis.com",
          rol: "DEVELOPER",
          activo: true,
          createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
          lastLogin: new Date(Date.now() - 900000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRol = filterRol === "todos" || u.rol === filterRol;
    const matchEstado = filterEstado === "todos" ||
                       (filterEstado === "activo" && u.activo) ||
                       (filterEstado === "inactivo" && !u.activo);
    return matchSearch && matchRol && matchEstado;
  });

  const rolColor = (rol: string) => {
    switch (rol) {
      case "ESTUDIANTE": return "bg-blue-100 text-blue-700";
      case "DOCENTE": return "bg-green-100 text-green-700";
      case "ADMIN": return "bg-purple-100 text-purple-700";
      case "DEVELOPER": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const rolIcon = (rol: string) => {
    switch (rol) {
      case "ESTUDIANTE": return <Users className="h-4 w-4 text-blue-500" />;
      case "DOCENTE": return <UserCheck className="h-4 w-4 text-green-500" />;
      case "ADMIN": return <Shield className="h-4 w-4 text-purple-500" />;
      case "DEVELOPER": return <Shield className="h-4 w-4 text-orange-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Users className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los roles</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="DOCENTE">Docentes</option>
          <option value="ADMIN">Admins</option>
          <option value="DEVELOPER">Developers</option>
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{usuarios.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Usuarios</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {usuarios.filter(u => u.rol === "ESTUDIANTE").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Estudiantes</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {usuarios.filter(u => u.rol === "DOCENTE").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Docentes</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {usuarios.filter(u => u.activo).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Activos</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Último Login</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Creado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm">
                        {usuario.nombre?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {usuario.nombre || "Sin nombre"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {usuario.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rolIcon(usuario.rol)}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${rolColor(usuario.rol)}`}>
                        {usuario.rol}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-sm ${usuario.activo ? "text-green-600" : "text-red-600"}`}>
                      {usuario.activo ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {usuario.lastLogin ? new Date(usuario.lastLogin).toLocaleString("es-CO") : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(usuario.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Editar">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
