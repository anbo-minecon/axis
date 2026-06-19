// components/developer/DeveloperPerfilTab.tsx
//
// Contenido de la pestaña "Mi Perfil" dentro de DeveloperDashboard.tsx.
// Usa el mismo token ("developer_token" en localStorage) y el mismo
// look-and-feel (inline styles, paleta oscura, JetBrains Mono) que el
// resto del dashboard de developer — por eso NO usa Tailwind ni el
// PerfilForm compartido del resto de la app.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const css = {
  card: {
    background: "#161b27",
    border: "1px solid #2a3347",
    borderRadius: 8,
    padding: "12px 14px",
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8fa0bc",
    textTransform: "uppercase" as const,
    letterSpacing: ".7px",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 500,
    border: "1px solid #344060",
    background: "transparent",
    color: "#8fa0bc",
    fontFamily: "inherit",
  } as React.CSSProperties,
  input: {
    width: "100%",
    background: "#0f1117",
    border: "1px solid #2a3347",
    borderRadius: 5,
    padding: "6px 9px",
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  } as React.CSSProperties,
  label: { fontSize: 10, color: "#8fa0bc", marginBottom: 4, display: "block" } as React.CSSProperties,
};

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("developer_token");
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

export function DeveloperPerfilTab() {
  const router = useRouter();
  const [data, setData] = useState<DeveloperPerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
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
      } catch (e) {
        console.error("[DeveloperPerfilTab] Error cargando perfil:", e);
        setMsg({ tipo: "error", texto: "No se pudo cargar el perfil" });
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
    } catch (e) {
      console.error("[DeveloperPerfilTab] Error cargando audit log:", e);
    } finally {
      setAuditLoading(false);
    }
  }

  const handleGuardar = async () => {
    const token = getToken();
    if (!token) return;
    setGuardando(true);
    setMsg(null);
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
      setMsg({ tipo: "ok", texto: "Perfil actualizado correctamente" });
    } catch (e: any) {
      setMsg({ tipo: "error", texto: e?.message ?? "No se pudo guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async () => {
    const token = getToken();
    if (!token) return;
    if (passwordForm.passwordNuevo.length < 8) {
      setMsg({ tipo: "error", texto: "La nueva contraseña debe tener al menos 8 caracteres" });
      return;
    }
    if (passwordForm.passwordNuevo !== passwordForm.passwordConfirmar) {
      setMsg({ tipo: "error", texto: "Las contraseñas no coinciden" });
      return;
    }
    setCambiandoPassword(true);
    setMsg(null);
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
      setMsg({ tipo: "ok", texto: "Contraseña actualizada" });
      setPasswordForm({ passwordActual: "", passwordNuevo: "", passwordConfirmar: "" });
    } catch (e: any) {
      setMsg({ tipo: "error", texto: e?.message ?? "No se pudo cambiar la contraseña" });
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#546280", fontSize: 12 }}>
        Cargando perfil...
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#546280", fontSize: 12 }}>
        No se pudo cargar el perfil
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 680 }}>
      {msg && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 11,
            background: msg.tipo === "ok" ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
            border: `1px solid ${msg.tipo === "ok" ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
            color: msg.tipo === "ok" ? "#22c55e" : "#ef4444",
          }}
        >
          {msg.texto}
        </div>
      )}

      {/* Datos básicos */}
      <div style={css.card}>
        <div style={{ ...css.sectionTitle, marginBottom: 10 }}>Datos básicos</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={css.label}>Nombre completo</label>
            <input
              style={css.input}
              value={form.nombre ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label style={css.label}>Foto de perfil (URL)</label>
            <input
              style={css.input}
              value={form.imagen ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, imagen: e.target.value }))}
            />
          </div>
          <div>
            <label style={css.label}>Documento</label>
            <input
              style={css.input}
              value={form.documento ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))}
            />
          </div>
          <div>
            <label style={css.label}>Teléfono</label>
            <input
              style={css.input}
              value={form.telefono ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{ ...css.btn, background: "rgba(59,130,246,.12)", borderColor: "rgba(59,130,246,.3)", color: "#60a5fa" }}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Seguridad */}
      <div style={css.card}>
        <div style={{ ...css.sectionTitle, marginBottom: 10 }}>Estado de seguridad</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 10, color: "#546280" }}>Último acceso</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#e2e8f0", marginTop: 2 }}>
              {formatFecha(data.developerCred?.ultimoAcceso ?? null)}
            </div>
          </div>
          <div style={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 10, color: "#546280" }}>Última IP</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#e2e8f0", marginTop: 2 }}>
              {data.developerCred?.direccionIP || "—"}
            </div>
          </div>
          <div style={{ background: "#1e2535", border: "1px solid #2a3347", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 10, color: "#546280" }}>Credencial</div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: data.developerCred?.activo ? "#22c55e" : "#ef4444",
                marginTop: 2,
              }}
            >
              {data.developerCred?.activo ? "Activa" : "Inactiva"}
            </div>
          </div>
        </div>

        <div style={{ ...css.sectionTitle, marginBottom: 10 }}>Cambiar contraseña</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={css.label}>Actual</label>
            <input
              type="password"
              style={css.input}
              value={passwordForm.passwordActual}
              onChange={(e) => setPasswordForm((p) => ({ ...p, passwordActual: e.target.value }))}
            />
          </div>
          <div>
            <label style={css.label}>Nueva</label>
            <input
              type="password"
              style={css.input}
              value={passwordForm.passwordNuevo}
              onChange={(e) => setPasswordForm((p) => ({ ...p, passwordNuevo: e.target.value }))}
            />
          </div>
          <div>
            <label style={css.label}>Confirmar</label>
            <input
              type="password"
              style={css.input}
              value={passwordForm.passwordConfirmar}
              onChange={(e) => setPasswordForm((p) => ({ ...p, passwordConfirmar: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleCambiarPassword}
            disabled={cambiandoPassword || !passwordForm.passwordActual}
            style={css.btn}
          >
            {cambiandoPassword ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </div>
      </div>

      {/* Audit log propio (distinto del tab "Auditoría" global) */}
      <div style={css.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={css.sectionTitle}>Tu actividad reciente ({auditTotal})</div>
        </div>
        {auditLog.length === 0 && !auditLoading ? (
          <div style={{ padding: 16, textAlign: "center", color: "#546280", fontSize: 11 }}>
            Sin acciones registradas todavía
          </div>
        ) : (
          <div>
            {auditLog.map((log) => (
              <div
                key={log.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #1e2535" }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "monospace",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: log.resultado === "EXITOSO" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
                    color: log.resultado === "EXITOSO" ? "#22c55e" : "#ef4444",
                    flexShrink: 0,
                  }}
                >
                  {log.resultado}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#e2e8f0",
                    flexShrink: 0,
                    width: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {log.accion}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#8fa0bc",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {log.recurso ?? "—"} {log.recursoId ? `· ${log.recursoId}` : ""}
                </span>
                <span style={{ fontSize: 10, color: "#546280", fontFamily: "monospace", flexShrink: 0 }}>
                  {formatFecha(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {auditLog.length < auditTotal && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <button onClick={() => cargarAuditLog(auditLog.length)} disabled={auditLoading} style={css.btn}>
              {auditLoading ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}