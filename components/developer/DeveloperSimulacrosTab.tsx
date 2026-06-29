"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClaveRespuesta = "A" | "B" | "C" | "D";

interface ClaveItem {
  id: string;
  numeroPregunta: number;
  respuesta: ClaveRespuesta;
  area: string | null;
  dificultad: string | null;
  sesionId: string | null;
}

interface SesionInfo {
  id: string;
  numero: number;
  nombre: string;
  tiempoMin: number;
}

interface SimulacroListItem {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
  totalClaves: number;
  sesiones: SesionInfo[];
}

interface SimulacroDetalle extends SimulacroListItem {
  claves: ClaveItem[];
}

const CSS = {
  panel: {
    display: "grid",
    gap: 16,
  } as React.CSSProperties,
  card: {
    background: "#161b27",
    border: "1px solid #2a3347",
    borderRadius: 12,
    padding: 18,
  } as React.CSSProperties,
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  } as React.CSSProperties,
  title: { fontSize: 18, fontWeight: 700, color: "#e2e8f0" } as React.CSSProperties,
  subTitle: { fontSize: 12, color: "#8fa0bc" } as React.CSSProperties,
  input: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "#0f1117",
    color: "#e2e8f0",
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
  } as React.CSSProperties,
  label: { display: "block", marginBottom: 6, fontSize: 11, color: "#8fa0bc" } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  } as React.CSSProperties,
  th: {
    textAlign: "left",
    padding: "10px 12px",
    color: "#8fa0bc",
    borderBottom: "1px solid #2a3347",
  } as React.CSSProperties,
  td: {
    padding: "10px 12px",
    color: "#e2e8f0",
    borderBottom: "1px solid #1e2535",
    verticalAlign: "middle",
  } as React.CSSProperties,
  btn: {
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "transparent",
    color: "#8fa0bc",
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  primaryBtn: {
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "#2563eb",
    color: "#ecfdf5",
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,
  dangerBtn: {
    borderRadius: 8,
    border: "1px solid rgba(239,68,68,.3)",
    background: "rgba(239,68,68,.12)",
    color: "#fca5a5",
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("developer_token");
}

export function DeveloperSimulacrosTab() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<SimulacroListItem[]>([]);
  const [selected, setSelected] = useState<SimulacroDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  const safeToken = useMemo(getToken, []);

  useEffect(() => {
    if (!safeToken) {
      router.push("/developer/login");
      return;
    }
    loadSimulacros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeToken]);

  async function loadSimulacros() {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/simulacros", {
        headers: { Authorization: `Bearer ${safeToken}` },
      });
      if (res.status === 401) {
        router.push("/developer/login");
        return;
      }
      const json = await res.json();
      setSimulacros(json.simulacros || []);
      setSelected(null);
    } catch (error) {
      console.error("Error cargando simulacros:", error);
      setAlert({ type: "error", message: "No se pudo cargar los simulacros." });
    } finally {
      setLoading(false);
    }
  }

  async function loadSimulacro(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/simulacros/${id}`, {
        headers: { Authorization: `Bearer ${safeToken}` },
      });
      if (res.status === 401) {
        router.push("/developer/login");
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo cargar el simulacro.");
      }
      const json = await res.json();
      setSelected(json.simulacro || null);
      setAlert(null);
    } catch (error: any) {
      console.error("Error cargando simulacro:", error);
      setAlert({ type: "error", message: error?.message || "No se pudo cargar el simulacro." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/developer/simulacros/${selected.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${safeToken}`,
        },
        body: JSON.stringify({
          nombre: selected.nombre,
          tiempoMin: selected.tiempoMin,
          totalPreguntas: selected.totalPreguntas,
          claves: selected.claves.map((clave) => ({ id: clave.id, respuesta: clave.respuesta })),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Error guardando cambios.");
      }
      await loadSimulacros();
      setAlert({ type: "ok", message: "Cambios guardados correctamente." });
    } catch (error: any) {
      console.error("Error guardando simulacro:", error);
      setAlert({ type: "error", message: error?.message || "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    const confirm = window.confirm(
      `¿Eliminar definitivamente el simulacro "${selected.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirm) return;
    setDeleting(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/developer/simulacros/${selected.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${safeToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Error eliminando el simulacro.");
      }
      setSelected(null);
      await loadSimulacros();
      setAlert({ type: "ok", message: "Simulacro eliminado." });
    } catch (error: any) {
      console.error("Error eliminando simulacro:", error);
      setAlert({ type: "error", message: error?.message || "No se pudo eliminar el simulacro." });
    } finally {
      setDeleting(false);
    }
  }

  function updateClaveRespuesta(index: number, respuesta: ClaveRespuesta) {
    if (!selected) return;
    const nuevos = [...selected.claves];
    nuevos[index] = { ...nuevos[index], respuesta };
    setSelected({ ...selected, claves: nuevos });
  }

  return (
    <div style={CSS.panel}>
      <div style={CSS.card}>
        <div style={CSS.headerRow}>
          <div>
            <div style={CSS.title}>Módulo de Simulacros</div>
            <div style={CSS.subTitle}>Administra simulacros, edita nombres, duración y respuestas de preguntas.</div>
          </div>
          <button style={CSS.primaryBtn} onClick={loadSimulacros} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>
      </div>

      {alert && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: alert.type === "ok" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
            border: alert.type === "ok" ? "1px solid rgba(34,197,94,.2)" : "1px solid rgba(239,68,68,.2)",
            color: alert.type === "ok" ? "#22c55e" : "#ef4444",
          }}
        >
          {alert.message}
        </div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", alignItems: "flex-start" }}>
        <div style={CSS.card}>
          <div style={{ marginBottom: 14, fontWeight: 600, color: "#e2e8f0" }}>Simulacros disponibles</div>
          <div style={{ overflowX: "auto" }}>
            <table style={CSS.table}>
              <thead>
                <tr>
                  <th style={CSS.th}>Nombre</th>
                  <th style={CSS.th}>Materia</th>
                  <th style={CSS.th}>Duración</th>
                  <th style={CSS.th}>Preguntas</th>
                  <th style={CSS.th}>Estado</th>
                  <th style={CSS.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {simulacros.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...CSS.td, textAlign: "center", color: "#546280" }}>
                      No hay simulacros disponibles.
                    </td>
                  </tr>
                ) : (
                  simulacros.map((sim) => (
                    <tr key={sim.id}>
                      <td style={CSS.td}>{sim.nombre}</td>
                      <td style={CSS.td}>{sim.materia}</td>
                      <td style={CSS.td}>{sim.tiempoMin} min</td>
                      <td style={CSS.td}>{sim.totalPreguntas}</td>
                      <td style={CSS.td}>{sim.estado}</td>
                      <td style={CSS.td}>
                        <button
                          style={CSS.btn}
                          onClick={() => loadSimulacro(sim.id)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={CSS.card}>
          <div style={{ marginBottom: 14, fontWeight: 600, color: "#e2e8f0" }}>Detalle / edición</div>
          {!selected ? (
            <div style={{ color: "#8fa0bc", fontSize: 13 }}>
              Selecciona un simulacro para editar el nombre, la duración y las respuestas.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={CSS.headerRow}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e2e8f0" }}>{selected.nombre}</div>
                  <div style={CSS.subTitle}>{selected.materia}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={CSS.subTitle}>Creado: {formatDate(selected.createdAt)}</div>
                  <div style={CSS.subTitle}>Actualizado: {formatDate(selected.updatedAt)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={CSS.label}>Nombre</label>
                  <input
                    style={CSS.input}
                    value={selected.nombre}
                    onChange={(event) => setSelected({ ...selected, nombre: event.target.value })}
                  />
                </div>
                <div>
                  <label style={CSS.label}>Duración (minutos)</label>
                  <input
                    style={CSS.input}
                    type="number"
                    min={1}
                    value={selected.tiempoMin}
                    onChange={(event) =>
                      setSelected({ ...selected, tiempoMin: Number(event.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label style={CSS.label}>Total de preguntas</label>
                  <input
                    style={CSS.input}
                    type="number"
                    min={1}
                    value={selected.totalPreguntas}
                    onChange={(event) =>
                      setSelected({ ...selected, totalPreguntas: Number(event.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 10, fontWeight: 600, color: "#e2e8f0" }}>
                  Respuestas de preguntas
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={CSS.table}>
                    <thead>
                      <tr>
                        <th style={CSS.th}>#</th>
                        <th style={CSS.th}>Sesión</th>
                        <th style={CSS.th}>Respuesta</th>
                        <th style={CSS.th}>Área</th>
                        <th style={CSS.th}>Dificultad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.claves.map((clave, index) => (
                        <tr key={clave.id}>
                          <td style={CSS.td}>{clave.numeroPregunta}</td>
                          <td style={CSS.td}>{clave.sesionId || "Única"}</td>
                          <td style={CSS.td}>
                            <select
                              style={{ ...CSS.input, padding: "8px 10px", width: 120 }}
                              value={clave.respuesta}
                              onChange={(event) =>
                                updateClaveRespuesta(index, event.target.value as ClaveRespuesta)
                              }
                            >
                              {(["A", "B", "C", "D"] as ClaveRespuesta[]).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={CSS.td}>{clave.area || "—"}</td>
                          <td style={CSS.td}>{clave.dificultad || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={CSS.primaryBtn}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  style={CSS.dangerBtn}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar simulacro"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
