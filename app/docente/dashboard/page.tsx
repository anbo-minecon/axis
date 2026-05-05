// app/docente/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users, ClipboardList, BarChart2, AlertCircle,
  TrendingUp, Plus, ChevronRight,
} from "lucide-react";

export const metadata = { title: "Panel Docente | AXIS Pre-ICFES" };

function getNivel(pts: number) {
  if (pts >= 400) return { label: "Alto",  color: "text-green-400" };
  if (pts >= 250) return { label: "Medio", color: "text-amber-400" };
  return           { label: "Bajo",  color: "text-red-400" };
}

function fmtFecha(iso: Date) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function DocenteDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  // ── Datos reales desde la BD ──────────────────────────────────────────────

  // Estudiantes activos (con suscripción)
  const estudiantesActivos = await db.usuario.count({
    where: { rol: "ESTUDIANTE", suscripcion: { activa: true } },
  });

  // Simulacros creados (ExamenTemplate publicados)
  let simulacrosCreados = 0;
  try {
    simulacrosCreados = await (db as any).examenTemplate.count({
      where: { estado: "PUBLICADO" },
    });
  } catch { /* modelo puede no existir aún */ }

  // Promedio global de clase (de todos los ResultadoSimulacro)
  let promedioClase = 0;
  try {
    const resultados = await db.resultadoSimulacro.findMany({
      select: { puntaje: true, total: true },
    });
    if (resultados.length > 0) {
      const avg = resultados.reduce((a, r) => a + (r.puntaje / r.total) * 500, 0) / resultados.length;
      promedioClase = Math.round(avg);
    }
  } catch { /* modelo puede no existir aún */ }

  // Pendientes de revisión: resultados con puntaje bajo (<50%)
  let pendientesRevision = 0;
  try {
    const todos = await db.resultadoSimulacro.findMany({
      select: { puntaje: true, total: true },
    });
    pendientesRevision = todos.filter((r) => (r.puntaje / r.total) < 0.5).length;
  } catch { /* modelo puede no existir aún */ }

  // Simulacros recientes
  let simulacrosRecientes: any[] = [];
  try {
    simulacrosRecientes = await (db as any).examenTemplate.findMany({
      where: { estado: "PUBLICADO" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { claves: true } } },
    });
  } catch { /* modelo puede no existir aún */ }

  // Resultados recientes para calcular promedios por simulacro
  let resultadosPorExamen: Map<string, { puntajes: number[]; totales: number[] }> = new Map();
  try {
    const resultados = await db.resultadoSimulacro.findMany({
      select: { examenId: true, puntaje: true, total: true },
    });
    for (const r of resultados) {
      if (!resultadosPorExamen.has(r.examenId)) {
        resultadosPorExamen.set(r.examenId, { puntajes: [], totales: [] });
      }
      resultadosPorExamen.get(r.examenId)!.puntajes.push(r.puntaje);
      resultadosPorExamen.get(r.examenId)!.totales.push(r.total);
    }
  } catch { /* modelo puede no existir aún */ }

  const stats = [
    {
      label: "Estudiantes activos",
      value: estudiantesActivos,
      sub: "Con suscripción activa",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "Simulacros creados",
      value: simulacrosCreados,
      sub: "Publicados en la plataforma",
      icon: ClipboardList,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Promedio de clase",
      value: promedioClase,
      sub: "Puntaje promedio (0–500)",
      icon: BarChart2,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "Pendientes de revisión",
      value: pendientesRevision,
      sub: "Resultados bajo el 50%",
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
    },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-[var(--text-primary)]">Panel Docente</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Bienvenido, {session.user.name}. Resumen del estado de tu clase.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-4 space-y-3"
          >
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
              <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cuerpo principal ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Simulacros recientes — ocupa 2 columnas */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Simulacros recientes</h2>
            <Link
              href="/docente/simulacros"
              className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear nuevo
            </Link>
          </div>

          {simulacrosRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <ClipboardList className="h-10 w-10 text-gray-700" />
              <p className="text-sm text-gray-500">No hay simulacros publicados aún</p>
              <Link
                href="/docente/simulacros"
                className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition"
              >
                Crear primer simulacro
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    {["Simulacro", "Preguntas", "Estudiantes", "Promedio", "Estado"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {simulacrosRecientes.map((s: any) => {
                    const datos = resultadosPorExamen.get(s.id);
                    const cantEstudiantes = datos?.puntajes.length ?? 0;
                    const promedio = datos && cantEstudiantes > 0
                      ? Math.round(
                          datos.puntajes.reduce((a, p, i) => a + (p / datos.totales[i]) * 500, 0) /
                          cantEstudiantes
                        )
                      : null;
                    const nivel = promedio !== null ? getNivel(promedio) : null;

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{s.nombre}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.materia}</p>
                        </td>
                        <td className="px-5 py-3 text-[var(--text-muted)] text-sm">{s._count.claves}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)] text-sm">{cantEstudiantes}</td>
                        <td className="px-5 py-3">
                          {promedio !== null ? (
                            <span className={cn("text-sm font-bold", nivel!.color)}>
                              {promedio} pts
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-green-400">
                            Publicado
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

          {/* Accesos rápidos */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
            {[
              { href: "/docente/simulacros", label: "Crear simulacro",    icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/20" },
              { href: "/docente/grupos",     label: "Ver mis grupos",     icon: Users,         color: "text-blue-400 bg-blue-500/20" },
              { href: "/docente/estadisticas", label: "Ver estadísticas", icon: TrendingUp,    color: "text-purple-400 bg-purple-500/20" },
              { href: "/docente/mensajes",   label: "Mensajes",           icon: BarChart2,     color: "text-amber-400 bg-amber-500/20" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] hover:border-white/15 transition group"
              >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color.split(" ")[1])}>
                  <Icon className={cn("h-4 w-4", color.split(" ")[0])} />
                </div>
                <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-[var(--text-muted)] transition" />
              </Link>
            ))}
          </div>

          {/* Estado de la plataforma */}
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Resumen</h2>
            {[
              { label: "Estudiantes con suscripción", value: estudiantesActivos, color: "text-green-400" },
              { label: "Promedio global", value: promedioClase > 0 ? `${promedioClase} pts` : "—", color: promedioClase >= 400 ? "text-green-400" : promedioClase >= 250 ? "text-amber-400" : "text-red-400" },
              { label: "Resultados bajos (<50%)", value: pendientesRevision, color: pendientesRevision > 0 ? "text-amber-400" : "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className={cn("text-sm font-bold", color)}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}