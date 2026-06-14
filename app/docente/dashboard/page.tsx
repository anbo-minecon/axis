// app/docente/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users, ClipboardList, BarChart2, AlertCircle,
  TrendingUp, TrendingDown, Minus, ChevronRight,
  CheckCircle2, Clock, BookOpen,
} from "lucide-react";

export const metadata = { title: "Panel Docente | AXIS Pre-ICFES" };
export const dynamic  = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────
function puntajeEfectivo(r: {
  estadoCalif:       string;
  puntajeTRI:        number | null;
  puntajePreliminar: number;
  puntaje:           number;
  total:             number;
}): number {
  if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
    return Math.round(Number(r.puntajeTRI));
  if (r.puntajePreliminar > 0)
    return Math.round(r.puntajePreliminar);
  if (r.puntaje > 0 && r.total > 0)
    return Math.round(Math.pow(r.puntaje / r.total, 1.8) * 100);
  return 0;
}

function getNivel(pct: number) {
  if (pct >= 80) return { label: "Alto",  color: "text-green-400",  icon: TrendingUp   };
  if (pct >= 50) return { label: "Medio", color: "text-amber-400",  icon: Minus        };
  return           { label: "Bajo",  color: "text-red-400",    icon: TrendingDown };
}

function fmtFecha(iso: Date) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const ESTADO_COLORS: Record<string, string> = {
  PUBLICADO: "bg-green-500/20 text-green-400 border-green-500/30",
  CERRADO:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  BORRADOR:  "bg-gray-500/20 text-gray-400 border-gray-500/30",
  ARCHIVADO: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ══════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════
export default async function DocenteDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const docenteId = session.user.id;

  // ── 1. Grupos del docente ─────────────────────────────────────────────
  const grupos = await db.grupo.findMany({
    where:   { docenteId },
    include: {
      estudiantes: {
        select: { id: true },
        where:  { rol: "ESTUDIANTE" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const idsEstudiantes = grupos.flatMap((g) => g.estudiantes.map((e) => e.id));
  const totalEstudiantes = idsEstudiantes.length;

  // ── 2. Simulacros accesibles (PUBLICADOS y CERRADOS) ──────────────────
  const simulacros = await (db as any).examenTemplate.findMany({
    where:   { estado: { in: ["PUBLICADO", "CERRADO"] } },
    include: { _count: { select: { claves: true, resultados: true } } },
    orderBy: { createdAt: "desc" },
    take:    10,
  });

  // ── 3. Resultados de los estudiantes del docente ──────────────────────
  const resultados = idsEstudiantes.length > 0
    ? await (db as any).resultadoSimulacro.findMany({
        where: { estudianteId: { in: idsEstudiantes } },
        select: {
          estudianteId:      true,
          examenId:          true,
          puntaje:           true,
          total:             true,
          puntajePreliminar: true,
          puntajeTRI:        true,
          estadoCalif:       true,
          completadoEn:      true,
          examen: { select: { nombre: true, materia: true } },
          estudiante: { select: { nombre: true } },
        },
        orderBy: { completadoEn: "desc" },
      })
    : [];

  // ── 4. Métricas ───────────────────────────────────────────────────────
  const pcts = resultados.map((r: any) => puntajeEfectivo(r));
  const promedioGlobal = pcts.length > 0
    ? Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length)
    : 0;

  const pendientesRevision = resultados.filter((r: any) => puntajeEfectivo(r) < 50).length;
  const simulacrosActivos  = simulacros.filter((s: any) => s.estado === "PUBLICADO").length;

  // Estudiantes que NO han completado ningún simulacro
  const estudiantesConResultado = new Set(resultados.map((r: any) => r.estudianteId));
  const sinActividad = idsEstudiantes.filter((id) => !estudiantesConResultado.has(id)).length;

  // ── 5. Tendencia (últimos 5 simulacros del grupo) ─────────────────────
  // Agrupar resultados por examen y calcular promedio del grupo
  const porExamen: Record<string, number[]> = {};
  for (const r of resultados) {
    if (!porExamen[r.examenId]) porExamen[r.examenId] = [];
    porExamen[r.examenId].push(puntajeEfectivo(r));
  }
  const evolucion = simulacros
    .filter((s: any) => porExamen[s.id]?.length > 0)
    .slice(0, 6)
    .reverse()
    .map((s: any) => {
      const arr = porExamen[s.id] ?? [];
      const avg = arr.length > 0
        ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length)
        : 0;
      return { nombre: s.nombre, promedio: avg, participantes: arr.length };
    });

  // ── 6. Alertas — estudiantes con bajo rendimiento ─────────────────────
  const ultimosPorEstudiante: Record<string, any> = {};
  for (const r of resultados) {
    if (!ultimosPorEstudiante[r.estudianteId])
      ultimosPorEstudiante[r.estudianteId] = r;
  }
  const alertas = Object.values(ultimosPorEstudiante)
    .filter((r: any) => puntajeEfectivo(r) < 50)
    .slice(0, 5);

  const nivelGlobal = getNivel(promedioGlobal);
  const NivelIcon   = nivelGlobal.icon;

  // ── 6. Simulacros para la tabla (top 5) ───────────────────────────────
  const simulacrosTabla = simulacros.slice(0, 5);

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[var(--text-primary)]">Panel Docente</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Bienvenido, {session.user.name}. Resumen del estado de tu clase.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Estudiantes activos",
            value: totalEstudiantes,
            sub:   `${grupos.length} grupo${grupos.length !== 1 ? "s" : ""}`,
            icon:  Users,
            color: "text-blue-400",
            bg:    "bg-blue-500/20",
          },
          {
            label: "Simulacros activos",
            value: simulacrosActivos,
            sub:   `${simulacros.length} en total`,
            icon:  ClipboardList,
            color: "text-emerald-400",
            bg:    "bg-emerald-500/20",
          },
          {
            label: "Promedio de clase",
            value: promedioGlobal > 0 ? `${promedioGlobal}%` : "—",
            sub:   nivelGlobal.label,
            icon:  BarChart2,
            color: nivelGlobal.color,
            bg:    "bg-purple-500/20",
          },
          {
            label: "Bajo rendimiento",
            value: pendientesRevision,
            sub:   "Con puntaje < 50%",
            icon:  AlertCircle,
            color: pendientesRevision > 0 ? "text-amber-400" : "text-green-400",
            bg:    "bg-amber-500/20",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-4 space-y-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cuerpo principal ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Simulacros recientes — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Simulacros recientes</h2>
            <Link href="/docente/simulacros"
              className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 transition">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {simulacrosTabla.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <ClipboardList className="h-10 w-10 text-gray-700" />
              <p className="text-sm text-gray-500">No hay simulacros publicados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    {["Simulacro", "Preg.", "Participantes", "Promedio", "Estado"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {simulacrosTabla.map((s: any) => {
                    const arr = porExamen[s.id] ?? [];
                    const avg = arr.length > 0
                      ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length)
                      : null;
                    const nivel = avg != null ? getNivel(avg) : null;
                    const NI    = nivel?.icon;

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-[160px]">
                            {s.nombre}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.materia}</p>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-sm">
                          {s._count.claves}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-sm">
                          {arr.length}/{totalEstudiantes}
                        </td>
                        <td className="px-4 py-3">
                          {avg != null && nivel && NI ? (
                            <span className={cn("flex items-center gap-1 text-sm font-bold", nivel.color)}>
                              <NI className="h-3 w-3" />{avg}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            ESTADO_COLORS[s.estado] ?? "bg-gray-500/20 text-gray-400",
                          )}>
                            {s.estado.charAt(0) + s.estado.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">

          {/* Alertas — bajo rendimiento */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Pendientes de atención
              </h2>
              {alertas.length > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {alertas.length} alertas
                </span>
              )}
            </div>

            {alertas.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sin alertas — ¡todo bien!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {alertas.map((r: any) => {
                  const pct = puntajeEfectivo(r);
                  return (
                    <div key={`${r.estudianteId}-${r.examenId}`}
                      className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {r.estudiante.nombre}
                        </p>
                        <p className="text-[10px] text-amber-400 mt-0.5 truncate">
                          {r.examen.nombre} · {pct}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evolución del grupo */}
          {evolucion.length >= 2 && (
            <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                Evolución del grupo
              </h2>
              <div className="space-y-2">
                {evolucion.map((e, i) => {
                  const n = getNivel(e.promedio);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 truncate">{e.nombre}</p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div className={cn("h-full rounded-full transition-all",
                            e.promedio >= 80 ? "bg-green-500"
                            : e.promedio >= 50 ? "bg-amber-500"
                            : "bg-red-500"
                          )} style={{ width: `${e.promedio}%` }} />
                        </div>
                      </div>
                      <span className={cn("text-xs font-extrabold shrink-0", n.color)}>
                        {e.promedio}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumen rápido */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Resumen</h2>
            {[
              {
                label: "Promedio global",
                value: promedioGlobal > 0 ? `${promedioGlobal}%` : "—",
                color: nivelGlobal.color,
              },
              {
                label: "Sin actividad",
                value: sinActividad,
                color: sinActividad > 0 ? "text-amber-400" : "text-green-400",
              },
              {
                label: "Evaluaciones TRI",
                value: resultados.filter((r: any) => r.estadoCalif === "OFICIAL").length,
                color: "text-violet-400",
              },
              {
                label: "Total evaluaciones",
                value: resultados.length,
                color: "text-white",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className={cn("text-sm font-bold", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Accesos rápidos */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-1.5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
            {[
              { href: "/docente/simulacros",   label: "Gestionar simulacros", icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/20" },
              { href: "/docente/grupos",       label: "Ver mis grupos",       icon: Users,         color: "text-blue-400 bg-blue-500/20"     },
              { href: "/docente/estadisticas", label: "Estadísticas",         icon: TrendingUp,    color: "text-purple-400 bg-purple-500/20"  },
              { href: "/docente/material",     label: "Material educativo",   icon: BookOpen,      color: "text-amber-400 bg-amber-500/20"   },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5 hover:bg-white/[0.05] hover:border-white/15 transition group">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", color.split(" ")[1])}>
                  <Icon className={cn("h-4 w-4", color.split(" ")[0])} />
                </div>
                <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}