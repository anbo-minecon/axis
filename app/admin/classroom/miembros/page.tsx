"use client";

// app/admin/classroom/miembros/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, UserPlus, UserCheck,
  Mail, Loader, RefreshCw, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Toast } from "@/lib/notifications";

interface EstudianteGoogle {
  googleUserId: string;
  nombre:       string;
  email:        string;
  foto:         string | null;
  enAxis:       boolean;
}
interface EstudianteAxis {
  id:     string;
  nombre: string;
  email:  string;
  imagen: string | null;
}

function MiembrosContent() {
  const searchParams          = useSearchParams();
  const claseId               = searchParams.get("claseId") ?? "";

  const [estudiantesG, setEstudiantesG] = useState<EstudianteGoogle[]>([]);
  const [estudiantesA, setEstudiantesA] = useState<EstudianteAxis[]>([]);
  const [claseNombre, setClaseNombre]   = useState("");
  const [loading, setLoading]           = useState(true);
  const [accionando, setAccionando]     = useState<string | null>(null);
  const [emailInvitar, setEmailInvitar] = useState("");
  const [enviandoInv, setEnviandoInv]   = useState(false);

  useEffect(() => {
    if (claseId) cargar();
  }, [claseId]);

  async function cargar() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/classroom/miembros?claseId=${claseId}`);
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      setEstudiantesG(data.estudiantesGoogle ?? []);
      setEstudiantesA(data.estudiantesAxis   ?? []);
      setClaseNombre(data.clase?.nombre ?? "Clase");
    } catch {
      Toast.error("Error", "No se pudieron cargar los miembros");
    } finally {
      setLoading(false);
    }
  }

  async function importar(email: string) {
    setAccionando(email);
    try {
      const res = await fetch("/api/classroom/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "importar", claseId, email }),
      });
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      Toast.success("Importado", data.mensaje);
      cargar();
    } finally {
      setAccionando(null);
    }
  }

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInvitar.trim()) return;
    setEnviandoInv(true);
    try {
      const res = await fetch("/api/classroom/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "invitar", claseId, email: emailInvitar }),
      });
      const data = await res.json();
      if (!res.ok) { Toast.error("Error", data.error); return; }
      Toast.success("Invitación enviada", emailInvitar);
      setEmailInvitar("");
    } finally {
      setEnviandoInv(false);
    }
  }

  if (!claseId) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        No se especificó una clase.{" "}
        <Link href="/admin/classroom" className="text-purple-600 hover:underline">
          Volver a Classroom
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/classroom`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-3 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Miembros — {claseNombre}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {estudiantesG.length} en Google Classroom · {estudiantesA.length} en Grupo AXIS
            </p>
          </div>
          <button
            onClick={cargar}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {/* Formulario invitar */}
      <div className="mb-6 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-purple-600" /> Invitar por email a Google Classroom
        </h2>
        <form onSubmit={invitar} className="flex gap-2">
          <input
            type="email"
            value={emailInvitar}
            onChange={e => setEmailInvitar(e.target.value)}
            placeholder="estudiante@gmail.com"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={enviandoInv}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
          >
            {enviandoInv ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Invitar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Estudiantes en Google Classroom */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                En Google Classroom ({estudiantesG.length})
              </h2>
            </div>
            {estudiantesG.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin estudiantes en Classroom</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {estudiantesG.map(eg => (
                  <div key={eg.googleUserId} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {eg.foto ? (
                        <img src={eg.foto} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
                          {eg.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{eg.nombre}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{eg.email}</p>
                      </div>
                    </div>

                    {eg.enAxis ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> En AXIS
                      </span>
                    ) : (
                      <button
                        onClick={() => importar(eg.email)}
                        disabled={accionando === eg.email}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition disabled:opacity-50"
                      >
                        {accionando === eg.email
                          ? <Loader className="h-3 w-3 animate-spin" />
                          : <UserCheck className="h-3 w-3" />
                        }
                        Importar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estudiantes en Grupo AXIS */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                En Grupo AXIS ({estudiantesA.length})
              </h2>
            </div>
            {estudiantesA.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-300 dark:text-amber-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Sin estudiantes en el grupo AXIS
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Usa "Importar" para agregarlos
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {estudiantesA.map(ea => (
                  <div key={ea.id} className="flex items-center gap-3 px-4 py-3">
                    {ea.imagen ? (
                      <img src={ea.imagen} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                        {ea.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ea.nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{ea.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MiembrosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <MiembrosContent />
    </Suspense>
  );
}