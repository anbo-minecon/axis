// components/shared/PerfilForm.tsx
//
// Formulario de "Mi Perfil" compartido entre ESTUDIANTE, DOCENTE y ADMIN.
// El rol DEVELOPER tiene su propio componente separado:
// components/developer/DeveloperPerfilPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Toast } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  KeyRound,
  User,
  MapPin,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export type RolPerfil = "ESTUDIANTE" | "DOCENTE" | "ADMIN";

interface PerfilData {
  id: string;
  nombre: string;
  email: string;
  imagen: string | null;
  documento: string | null;
  telefono: string | null;
  departamento: string | null;
  municipio: string | null;
  ciudad: string | null;
  colegio: string | null;
  grado: number | null;
}

interface PerfilFormProps {
  rol: RolPerfil;
}

const CAMPOS_POR_ROL: Record<RolPerfil, Array<keyof PerfilData>> = {
  ESTUDIANTE: ["documento", "telefono", "departamento", "municipio", "ciudad", "colegio", "grado"],
  DOCENTE: ["documento", "telefono", "departamento", "municipio", "ciudad"],
  ADMIN: ["documento", "telefono"],
};

const ETIQUETAS: Partial<Record<keyof PerfilData, string>> = {
  documento: "Documento de identidad",
  telefono: "Teléfono",
  departamento: "Departamento",
  municipio: "Municipio",
  ciudad: "Ciudad",
  colegio: "Colegio",
  grado: "Grado",
};

const BADGE_ROL: Record<RolPerfil, { label: string; className: string }> = {
  ESTUDIANTE: {
    label: "Estudiante",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  DOCENTE: {
    label: "Docente",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  ADMIN: {
    label: "Administrador",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
};

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

function getInitials(nombre: string) {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function PerfilForm({ rol }: PerfilFormProps) {
  const [data, setData] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: "",
  });

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const perfil = await trpc.perfil.obtener.query();
        if (!activo) return;
        setData(perfil as PerfilData);
        setForm({
          nombre: perfil.nombre ?? "",
          imagen: perfil.imagen ?? "",
          documento: perfil.documento ?? "",
          telefono: perfil.telefono ?? "",
          departamento: perfil.departamento ?? "",
          municipio: perfil.municipio ?? "",
          ciudad: perfil.ciudad ?? "",
          colegio: perfil.colegio ?? "",
          grado: perfil.grado != null ? String(perfil.grado) : "",
        });
      } catch (error) {
        console.error("[PerfilForm] Error cargando perfil:", error);
        Toast.error("No se pudo cargar tu perfil", "Intenta recargar la página");
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre?.trim() || undefined,
        imagen: form.imagen?.trim() || null,
        documento: form.documento?.trim() || null,
        telefono: form.telefono?.trim() || null,
        departamento: form.departamento?.trim() || null,
        municipio: form.municipio?.trim() || null,
        ciudad: form.ciudad?.trim() || null,
        colegio: form.colegio?.trim() || null,
        grado: form.grado ? Number(form.grado) : null,
      };
      const actualizado = await trpc.perfil.actualizar.mutate(payload);
      setData((prev) => (prev ? { ...prev, ...actualizado } : prev));
      Toast.success("Perfil actualizado", "Tus datos se guardaron correctamente");
    } catch (error: any) {
      console.error("[PerfilForm] Error guardando:", error);
      Toast.error("No se pudo guardar", error?.message ?? "Intenta de nuevo");
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async () => {
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
      await trpc.perfil.cambiarPassword.mutate({
        passwordActual: passwordForm.passwordActual,
        passwordNuevo: passwordForm.passwordNuevo,
      });
      Toast.success("Contraseña actualizada");
      setPasswordForm({ passwordActual: "", passwordNuevo: "", passwordConfirmar: "" });
    } catch (error: any) {
      console.error("[PerfilForm] Error cambiando contraseña:", error);
      Toast.error(
        "No se pudo cambiar la contraseña",
        error?.message ?? "Verifica tu contraseña actual"
      );
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        No se pudo cargar el perfil.
      </p>
    );
  }

  const badge = BADGE_ROL[rol];
  const campos = CAMPOS_POR_ROL[rol];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      {/* Encabezado */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {form.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imagen} alt={data.nombre} className="h-full w-full object-cover" />
            ) : (
              getInitials(data.nombre || "?")
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">
              {data.nombre}
            </h1>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{data.email}</p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <User className="h-4 w-4 text-blue-500" />
          Datos básicos
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre completo">
            <input
              value={form.nombre ?? ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className={inputClass}
              placeholder="Tu nombre"
            />
          </Campo>
          <Campo label="Foto de perfil (URL)">
            <input
              value={form.imagen ?? ""}
              onChange={(e) => handleChange("imagen", e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </Campo>
        </div>
      </div>

      {/* Datos personales / contacto / académicos según el rol */}
      {campos.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {rol === "ESTUDIANTE" ? (
              <GraduationCap className="h-4 w-4 text-blue-500" />
            ) : (
              <MapPin className="h-4 w-4 text-blue-500" />
            )}
            {rol === "ESTUDIANTE" ? "Datos personales y académicos" : "Datos de contacto"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((campo) => (
              <Campo key={campo} label={ETIQUETAS[campo] ?? campo}>
                <input
                  type={campo === "grado" ? "number" : "text"}
                  min={campo === "grado" ? 1 : undefined}
                  max={campo === "grado" ? 13 : undefined}
                  value={form[campo] ?? ""}
                  onChange={(e) => handleChange(campo, e.target.value)}
                  className={inputClass}
                  placeholder={campo === "grado" ? "Ej: 11" : ""}
                />
              </Campo>
            ))}
          </div>
        </div>
      )}

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>

      {/* Seguridad — cambiar contraseña */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <KeyRound className="h-4 w-4 text-blue-500" />
          Seguridad — cambiar contraseña
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Si iniciaste sesión con Google, no tienes contraseña local y esta sección no aplica.
        </p>

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
          <Campo label="Confirmar contraseña">
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

        <div className="flex justify-end">
          <button
            onClick={handleCambiarPassword}
            disabled={cambiandoPassword || !passwordForm.passwordActual}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
          >
            {cambiandoPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Actualizar contraseña
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}