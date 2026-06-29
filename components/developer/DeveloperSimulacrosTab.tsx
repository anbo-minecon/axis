"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type ClaveRespuesta = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

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

interface Props {
  token: string;
}

const CSS = {
  panel: { display: "grid", gap: 16 } as React.CSSProperties,
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
    flexWrap: "wrap" as const,
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
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 11,
    color: "#8fa0bc",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 12,
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    color: "#8fa0bc",
    borderBottom: "1px solid #2a3347",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  td: {
    padding: "10px 12px",
    color: "#e2e8f0",
    borderBottom: "1px solid #1e2535",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,
  btn: {
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "transparent",
    color: "#8fa0bc",
    padding: "7px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
  } as React.CSSProperties,
  primaryBtn: {
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
  } as React.CSSProperties,
  dangerBtn: {
    borderRadius: 8,
    border: "1px solid rgba(239,68,68,.3)",
    background: "rgba(239,68,68,.12)",
    color: "#fca5a5",
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
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

function EstadoBadge({ estado }: { estado: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    PUBLICADO:  { bg: "rgba(34,197,94,.15)",   color: "#22c55e", border: "rgba(34,197,94,.3)"   },
    BORRADOR:   { bg: "rgba(100,116,139,.15)",  color: "#94a3b8", border: "rgba(100,116,139,.3)" },
    CERRADO:    { bg: "rgba(245,158,11,.15)",   color: "#f59e0b", border: "rgba(245,158,11,.3)"  },
    ARCHIVADO:  { bg: "rgba(139,92,246,.15)",   color: "#a78bfa", border: "rgba(139,92,246,.3)"  },
  };
  const c = cfg[estado] ?? { bg: "rgba(100,116,139,.1)", color: "#8fa0bc", border: "rgba(100,116,139,.2)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".5px",
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {estado}
    </span>
  );
}

export function DeveloperSimulacrosTab({ token }: Props) {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<SimulacroListItem[]>([]);
  const [filteredSimulacros, setFilteredSimulacros] = useState<SimulacroListItem[]>([]);
  const [selected, setSelected] = useState<SimulacroDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  // ── FIX PRINCIPAL: esperar a que el token esté disponible ──────────────
  const loadSimulacros = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch("/api/developer/simulacros", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) { router.push("/developer/login"); return; }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const lista: SimulacroListItem[] = json.simulacros || [];
      setSimulacros(lista);
      setFilteredSimulacros(lista);
      setSelected(null);
    } catch {
      setAlert({ type: "error", message: "No se pudo cargar la lista de simulacros." });
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  // Espera a que el token llegue del padre antes de hacer el fetch
  useEffect(() => {
    if (token) loadSimulacros();
  }, [token, loadSimulacros]);

  // Filtro local (sin nueva llamada a API)
  useEffect(() => {
    let result = simulacros;
    if (filtroEstado !== "TODOS") {
      result = result.filter((s) => s.estado === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.nombre.toLowerCase().includes(q) ||
          s.materia.toLowerCase().includes(q)
      );
    }
    setFilteredSimulacros(result);
  }, [search, filtroEstado, simulacros]);

  async function loadSimulacro(id: string) {
    setLoadingDetalle(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/developer/simulacros/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) { router.push("/developer/login"); return; }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo cargar el simulacro.");
      }
      const json = await res.json();
      setSelected(json.simulacro || null);
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "Error al cargar el simulacro." });
    } finally {
      setLoadingDetalle(false);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: selected.nombre,
          tiempoMin: selected.tiempoMin,
          totalPreguntas: selected.totalPreguntas,
          claves: selected.claves.map((c) => ({ id: c.id, respuesta: c.respuesta })),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Error guardando cambios.");
      }
      await loadSimulacros();
      setAlert({ type: "ok", message: "✓ Cambios guardados correctamente." });
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    const ok = window.confirm(
      `¿Eliminar definitivamente "${selected.nombre}"?\n\nEsta acción eliminará también todas las claves y resultados asociados. No se puede deshacer.`
    );
    if (!ok) return;
    setDeleting(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/developer/simulacros/${selected.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Error eliminando el simulacro.");
      }
      setSelected(null);
      await loadSimulacros();
      setAlert({ type: "ok", message: "✓ Simulacro eliminado correctamente." });
    } catch (error: any) {
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

  const estadosUnicos = ["TODOS", ...Array.from(new Set(simulacros.map((s) => s.estado)))];

  return (
    <div style={CSS.panel}>
      {/* ── Header ── */}
      <div style={CSS.card}>
        <div style={CSS.headerRow}>
          <div>
            <div style={CSS.title}>Módulo de Simulacros</div>
            <div style={CSS.subTitle}>
              {simulacros.length} simulacros en total · administra, edita y elimina
            </div>
          </div>
          <button
            style={CSS.primaryBtn}
            onClick={loadSimulacros}
            disabled={loading}
          >
            {loading ? "Cargando..." : "↻ Actualizar lista"}
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {alert && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: alert.type === "ok" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
          border: alert.type === "ok" ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(239,68,68,.25)",
          color: alert.type === "ok" ? "#22c55e" : "#ef4444",
          fontSize: 13,
        }}>
          {alert.message}
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Buscar por nombre o materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #2a3347",
            background: "#161b27",
            color: "#e2e8f0",
            fontSize: 12,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {estadosUnicos.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: filtroEstado === e ? "#3b82f6" : "#2a3347",
                background: filtroEstado === e ? "rgba(59,130,246,.15)" : "transparent",
                color: filtroEstado === e ? "#60a5fa" : "#8fa0bc",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid lista + detalle ── */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.2fr 1fr", alignItems: "flex-start" }}>

        {/* ── Lista ── */}
        <div style={CSS.card}>
          <div style={{ marginBottom: 14, fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>
            Simulacros ({filteredSimulacros.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={CSS.table}>
              <thead>
                <tr style={{ background: "#1a2035" }}>
                  <th style={CSS.th}>Nombre</th>
                  <th style={CSS.th}>Materia</th>
                  <th style={CSS.th}>Min</th>
                  <th style={CSS.th}>Preg.</th>
                  <th style={CSS.th}>Estado</th>
                  <th style={CSS.th}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ ...CSS.td, textAlign: "center", color: "#546280", padding: 32 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 24, height: 24, border: "2px solid #2a3347", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Cargando simulacros...
                      </div>
                    </td>
                  </tr>
                ) : filteredSimulacros.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...CSS.td, textAlign: "center", color: "#546280", padding: 32 }}>
                      {search || filtroEstado !== "TODOS"
                        ? "Sin resultados para el filtro aplicado."
                        : "No hay simulacros disponibles."}
                    </td>
                  </tr>
                ) : (
                  filteredSimulacros.map((sim) => (
                    <tr
                      key={sim.id}
                      style={{
                        cursor: "pointer",
                        background: selected?.id === sim.id ? "rgba(59,130,246,.08)" : "transparent",
                        transition: "background .15s",
                      }}
                      onClick={() => loadSimulacro(sim.id)}
                    >
                      <td style={{ ...CSS.td, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sim.nombre}
                      </td>
                      <td style={{ ...CSS.td, color: "#8fa0bc" }}>{sim.materia}</td>
                      <td style={CSS.td}>{sim.tiempoMin}</td>
                      <td style={CSS.td}>{sim.totalPreguntas}</td>
                      <td style={CSS.td}><EstadoBadge estado={sim.estado} /></td>
                      <td style={CSS.td}>
                        <button
                          style={{
                            ...CSS.btn,
                            background: selected?.id === sim.id ? "rgba(59,130,246,.2)" : "transparent",
                            color: selected?.id === sim.id ? "#60a5fa" : "#8fa0bc",
                            padding: "5px 10px",
                          }}
                          onClick={(e) => { e.stopPropagation(); loadSimulacro(sim.id); }}
                          disabled={loadingDetalle}
                        >
                          {selected?.id === sim.id ? "✓" : "Editar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Detalle / Edición ── */}
        <div style={CSS.card}>
          <div style={{ marginBottom: 14, fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>
            Detalle / Edición
          </div>

          {loadingDetalle ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#546280", padding: 20 }}>
              <div style={{ width: 18, height: 18, border: "2px solid #2a3347", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Cargando...
            </div>
          ) : !selected ? (
            <div style={{ color: "#546280", fontSize: 13, padding: "20px 0" }}>
              👆 Selecciona un simulacro de la lista para editar su nombre, duración y claves de respuesta.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>

              {/* Info */}
              <div style={{ background: "#1a2035", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>{selected.nombre}</div>
                  <div style={{ color: "#8fa0bc", fontSize: 11, marginTop: 3 }}>{selected.materia}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <EstadoBadge estado={selected.estado} />
                  <div style={{ fontSize: 10, color: "#546280", marginTop: 4 }}>
                    {formatDate(selected.updatedAt)}
                  </div>
                </div>
              </div>

              {/* Campos editables */}
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={CSS.label}>Nombre del simulacro</label>
                  <input
                    style={CSS.input}
                    value={selected.nombre}
                    onChange={(e) => setSelected({ ...selected, nombre: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={CSS.label}>Duración (minutos)</label>
                    <input
                      style={CSS.input}
                      type="number"
                      min={1}
                      value={selected.tiempoMin}
                      onChange={(e) => setSelected({ ...selected, tiempoMin: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={CSS.label}>Total preguntas</label>
                    <input
                      style={CSS.input}
                      type="number"
                      min={1}
                      value={selected.totalPreguntas}
                      onChange={(e) => setSelected({ ...selected, totalPreguntas: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Claves de respuesta */}
              {selected.claves.length > 0 && (
                <div>
                  <div style={{ marginBottom: 10, fontWeight: 600, color: "#e2e8f0", fontSize: 12 }}>
                    Claves de respuesta ({selected.claves.length})
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto", borderRadius: 8, border: "1px solid #2a3347" }}>
                    <table style={CSS.table}>
                      <thead style={{ position: "sticky", top: 0, background: "#1a2035" }}>
                        <tr>
                          <th style={{ ...CSS.th, fontSize: 11 }}>#</th>
                          <th style={{ ...CSS.th, fontSize: 11 }}>Sesión</th>
                          <th style={{ ...CSS.th, fontSize: 11 }}>Respuesta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.claves.map((clave, index) => (
                          <tr key={clave.id}>
                            <td style={{ ...CSS.td, fontSize: 11, color: "#8fa0bc" }}>
                              {clave.numeroPregunta}
                            </td>
                            <td style={{ ...CSS.td, fontSize: 11, color: "#546280" }}>
                              {clave.sesionId ? `Sesión` : "—"}
                            </td>
                            <td style={CSS.td}>
                              <select
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #2a3347",
                                  background: "#0f1117",
                                  color: "#e2e8f0",
                                  fontSize: 12,
                                  fontFamily: "inherit",
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                                value={clave.respuesta}
                                onChange={(e) => updateClaveRespuesta(index, e.target.value as ClaveRespuesta)}
                              >
                                {(["A", "B", "C", "D", "E", "F", "G", "H"] as ClaveRespuesta[]).map((o) => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selected.claves.length === 0 && (
                <div style={{ color: "#546280", fontSize: 12, padding: "8px 0" }}>
                  Este simulacro no tiene claves de respuesta registradas.
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button
                  style={{ ...CSS.primaryBtn, flex: 1, opacity: saving ? 0.6 : 1 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  style={{ ...CSS.dangerBtn, opacity: deleting ? 0.6 : 1 }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}