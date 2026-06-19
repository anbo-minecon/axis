// components/developer/DeveloperPerfilPanel.tsx
//
// Panel de "Mi Perfil" exclusivo para el rol DEVELOPER.
// A propósito NO reutiliza PerfilForm: el Developer se autentica con un
// token Bearer independiente (ver lib/developer-guard.ts), no con la
// sesión de NextAuth, así que habla con sus propios endpoints en
// /api/developer/perfil/*.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  KeyRound,
  ShieldAlert,
  Terminal,
  Clock,
  Globe,
  ScrollText,
  ChevronDown,
} from "lucide-react";

// ⚠️ Ajusta esta clave al nombre real que usa tu página /developer/login
// para guardar el token (localStorage, cookie, etc.). Aquí se asume
// localStorage como mecanismo más común para un Bearer token de SPA.
const DEV_TOKEN_KEY = "axis_developer_token";

interface DeveloperPerfilData {
  id: string;
  nombre: string;
  email: string;
  imagen: string | null;
  documento: string | null;
  telefono: string | null;
  createdAt: string;
  developerCred: {
    activo: boolean;
    ultimoAcceso: string | null;
    direccionIP: string | null;
    createdAt: string;
  } | null;
}

interface AuditLogItem {
  id: string;
  accion: string;
  recurso: string | null;
  recursoId: string | null;
  resultado: string;
  mensaje: string | null;
  ip: string | null;
  createdAt: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 font-mono";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEV_TOKEN_KEY);
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeveloperPerfilPanel() {
  const router = useRouter();
  const [data, setData] = useState<DeveloperPerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: "",
  });

  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/developer/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/developer/perfil", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/developer/login");
          return;
        }
        const json = await res.json();
        setData(json.usuario);
        setForm({
          nombre: json.usuario.nombre ?? "",
          imagen: json.usuario.imagen ?? "",
          documento: json.usuario.documento ?? "",
          telefono: json.usuario.telefono ?? "",
        });
      } catch (error) {
        console.error("[DeveloperPerfilPanel] Error cargando perfil:", error);
        Toast.error("No se pudo cargar el perfil de developer");
      } finally {
        setLoading(false);
      }
    })();

    cargarAuditLog(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarAuditLog(skip: number) {
    const token = getToken();
    if (!token) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/developer/perfil/audit-log?skip=${skip}&take=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setAuditLog((prev) => (skip === 0 ? json.items : [...prev, ...json.items]));
      setAuditTotal(json.total ?? 0);
    } catch (error) {
      console.error("[DeveloperPerfilPanel] Error cargando audit log:", error);
    } finally {
      setAuditLoading(false);
    }
  }

  const handleGuardar = async () => {
    const token = getToken();
    if (!token) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/developer/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: form.nombre?.trim() || undefined,
          imagen: form.imagen?.trim() || null,
          documento: form.documento?.trim() || null,
          telefono: form.telefono?.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Error guardando perfil");
      }
      const json = await res.json();
      setData((prev) => (prev ? { ...prev, ...json.usuario } : prev));
      Toast.success("Perfil de developer actualizado");
    } catch (error: any) {
      Toast.error("No se pudo guardar", error?.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async () => {
    const token = getToken();
    if (!token) return;
    if (passwordForm.passwordNuevo.length < 8) {
      Toast.warning("Contraseña muy corta", "Usa al menos 8 caracteres");
      return;
    }
    if (passwordForm.passwordNuevo !== passwordForm.passwordConfirmar) {
      Toast.warning("Las contraseñas no coinciden");
      return;
    }
    setCambiandoPassword(true);
    try {
      const res = await fetch("/api/developer/perfil/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          passwordActual: passwordForm.passwordActual,
          passwordNuevo: passwordForm.passwordNuevo,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Error cambiando contraseña");
      }
      Toast.success("Contraseña de developer actualizada");
      setPasswordForm({ passwordActual: "", passwordNuevo: "", passwordConfirmar: "" });
    } catch (error: any) {
      Toast.error("No se pudo cambiar la contraseña", error?.message);
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        No se pudo cargar el perfil de developer.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      {/* Encabezado */}
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900 p-5 shadow-lg shadow-cyan-500/5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-800 text-cyan-400">
            <Terminal className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white">{data.nombre}</h1>
            <p className="truncate text-sm text-slate-400 font-mono">{data.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              <ShieldAlert className="h-3 w-3" /> Developer
            </span>
          </div>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Datos básicos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre completo">
            <input
              value={form.nombre ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Foto de perfil (URL)">
            <input
              value={form.imagen ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, imagen: e.target.value }))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Documento">
            <input
              value={form.documento ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Teléfono">
            <input
              value={form.telefono ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              className={inputClass}
            />
          </Campo>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Seguridad */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          Estado de seguridad
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <InfoSeguridad
            icon={Clock}
            label="Último acceso"
            valor={formatFecha(data.developerCred?.ultimoAcceso ?? null)}
          />
          <InfoSeguridad
            icon={Globe}
            label="Última IP"
            valor={data.developerCred?.direccionIP || "—"}
          />
          <InfoSeguridad
            icon={ShieldAlert}
            label="Estado de credencial"
            valor={data.developerCred?.activo ? "Activa" : "Inactiva"}
            destacado={data.developerCred?.activo}
          />
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            Cambiar contraseña
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Contraseña actual">
              <input
                type="password"
                value={passwordForm.passwordActual}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, passwordActual: e.target.value }))
                }
                className={inputClass}
              />
            </Campo>
            <Campo label="Contraseña nueva">
              <input
                type="password"
                value={passwordForm.passwordNuevo}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, passwordNuevo: e.target.value }))
                }
                className={inputClass}
              />
            </Campo>
            <Campo label="Confirmar">
              <input
                type="password"
                value={passwordForm.passwordConfirmar}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, passwordConfirmar: e.target.value }))
                }
                className={inputClass}
              />
            </Campo>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleCambiarPassword}
              disabled={cambiandoPassword || !passwordForm.passwordActual}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
            >
              {cambiandoPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Actualizar contraseña
            </button>
          </div>
        </div>
      </div>

      {/* Audit log propio */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ScrollText className="h-4 w-4 text-cyan-400" />
          Tu actividad reciente ({auditTotal})
        </h2>

        {auditLog.length === 0 && !auditLoading ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Sin acciones registradas todavía.
          </p>
        ) : (
          <div className="space-y-2">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-slate-200">{log.accion}</p>
                  <p className="truncate text-xs text-slate-500">
                    {log.recurso ?? "—"} {log.recursoId ? `· ${log.recursoId}` : ""} ·{" "}
                    {log.ip ?? "IP desconocida"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      log.resultado === "EXITOSO"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    )}
                  >
                    {log.resultado}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">{formatFecha(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {auditLog.length < auditTotal && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => cargarAuditLog(auditLog.length)}
              disabled={auditLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-60"
            >
              {auditLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function InfoSeguridad({
  icon: Icon,
  label,
  valor,
  destacado,
}: {
  icon: any;
  label: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn("mt-1 font-mono text-sm", destacado ? "text-emerald-400" : "text-slate-200")}>
        {valor}
      </p>
    </div>
  );
}