// app/admin/dashboard/page.tsx
import { db } from "@/lib/db";
import { logIntento } from "@/lib/logger";
import Link from "next/link";
import { Users, BadgeCheck, ClipboardCheck, Clock } from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Barra de progreso ── */
function ProgressBar({
  label,
  value,
  max,
  display,
  color,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
      <span className="w-full sm:w-56 flex-shrink-0 text-xs md:text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 h-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-full sm:w-24 sm:text-right text-right text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">{display}</span>
    </div>
  );
}

/* ── Gráfico de barras SVG simple ── */
function BarChart({ data }: { data: { day: string; simulacros: number; registros: number }[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.simulacros, d.registros)), 1);
  const chartH = 100;
  const barW = 12;
  const gap = 6;
  const groupW = barW * 2 + gap + 12;
  const totalW = data.length * groupW;

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={chartH + 28}
        style={{ minWidth: "100%" }}
        viewBox={`0 0 ${totalW} ${chartH + 28}`}
      >
        {/* Líneas guía */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = chartH - frac * chartH;
          const val = Math.round(frac * maxVal);
          return (
            <g key={frac}>
              <line x1={0} y1={y} x2={totalW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={2} y={y - 2} fontSize={8} fill="#9ca3af">{val}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = i * groupW + 6;
          const hSim = (d.simulacros / maxVal) * chartH;
          const hReg = (d.registros / maxVal) * chartH;
          return (
            <g key={d.day}>
              {/* Barra simulacros (azul) */}
              <rect
                x={x}
                y={chartH - hSim}
                width={barW}
                height={hSim}
                rx={2}
                fill="#3b82f6"
              />
              {/* Barra registros (verde) */}
              <rect
                x={x + barW + gap}
                y={chartH - hReg}
                width={barW}
                height={hReg}
                rx={2}
                fill="#22c55e"
              />
              {/* Etiqueta día */}
              <text
                x={x + barW + gap / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda - Responsive */}
      <div className="mt-3 flex flex-wrap gap-3 md:gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-sm bg-blue-500 inline-block" />
          Simulacros
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3 rounded-sm bg-green-500 inline-block" />
          Registros
        </span>
      </div>
    </div>
  );
}

/* ── Página ── */
export default async function AdminDashboardPage() {
  // ── Stats ──
  let totalUsuarios = 0;
  let suscripcionesActivas = 0;
  let simulacrosCompletados = 0;
  let validacionesPendientes = 0;
  let estudiantesCount = 0;
  let porcentajeSuscripciones = 0;
  let promedioGeneral = 0;
  let pendingValidations: any[] = [];

  try {
    // Excluir DEVELOPER siempre
    totalUsuarios = await db.usuario.count({
      where: { NOT: { rol: "DEVELOPER" } },
    });
    estudiantesCount = await db.usuario.count({
      where: { rol: "ESTUDIANTE" },
    });

    suscripcionesActivas = await db.suscripcion.count({
      where: { activa: true },
    });

    porcentajeSuscripciones =
      totalUsuarios > 0
        ? Math.round((suscripcionesActivas / totalUsuarios) * 100)
        : 0;

    // Simulacros completados
    simulacrosCompletados = await db.intento.count({
      where: { estado: "completado" },
    });

    // Log de acceso al dashboard
    logIntento({
      usuarioId: "admin-dashboard",
      accion: "ACCESO_DASHBOARD_ADMIN",
      estado: "EXITOSO",
      detalles: {
        totalUsuarios,
        simulacrosCompletados,
        suscripcionesActivas
      }
    });

    // Suscripciones pendientes (activa=false pero tiene plan)
    validacionesPendientes = await db.suscripcion.count({
      where: { activa: false },
    });

    // Usuarios sin suscripción activa pero con suscripción pendiente
    pendingValidations = await db.usuario.findMany({
      where: {
        rol: "ESTUDIANTE",
        suscripcion: {
          activa: false,
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        createdAt: true,
        suscripcion: {
          select: { id: true, plan: { select: { nombre: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    // Promedio general (intentos completados)
    const intentos = await db.intento.findMany({
      where: { estado: "completado" },
      include: {
        respuestasUser: {
          // respuestasUser en Intento son de tipo RespuestaIntento
        },
      },
      take: 200,
    });

    if (intentos.length > 0) {
      const puntajes = intentos
        .filter((i) => i.puntaje !== null && i.puntaje !== undefined)
        .map((i) => i.puntaje ?? 0);
      promedioGeneral = puntajes.length > 0 ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : 0;
    }
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
    // Datos vacíos si los modelos aún no tienen data
  }

  // ── Datos del chart (últimos 7 días) ──
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const chartData = dias.map((day) => ({
    day,
    simulacros: 0,
    registros: 0,
  }));

  const stats = [
    {
      label: "Usuarios registrados",
      value: totalUsuarios,
      sub: `+0 este mes`,
      icon: Users,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "Suscripciones activas",
      value: suscripcionesActivas,
      sub: `${porcentajeSuscripciones}% del total`,
      icon: BadgeCheck,
      color: "text-green-600 bg-green-50 dark:bg-green-900/30",
    },
    {
      label: "Simulacros completados",
      value: simulacrosCompletados,
      sub: "Total acumulado",
      icon: ClipboardCheck,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    },
    {
      label: "Validaciones pendientes",
      value: validacionesPendientes,
      sub: "Requieren atención",
      icon: Clock,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Responsive Typography */}
        <div className="flex flex-col gap-1 md:gap-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Panel Administrador
          </h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Resumen general del sistema AXIS Pre-ICFES.
          </p>
        </div>

        {/* Banner validaciones - Responsive */}
        {validacionesPendientes > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-3 md:p-4">
            <div className="flex items-start md:items-center gap-2 md:gap-3">
              <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 md:mt-0" />
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {validacionesPendientes} suscripciones pendientes de validación
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                  Estos estudiantes han contactado al equipo AXIS y esperan que su acceso sea habilitado.
                </p>
              </div>
            </div>
            <Link
              href="/admin/suscripciones"
              className="flex-shrink-0 rounded-lg bg-amber-400 dark:bg-amber-600 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-amber-500 transition text-center"
            >
              Revisar
            </Link>
          </div>
        )}

        {/* Stats - Grid-cols-2 for mobile, md:grid-cols-3, lg:grid-cols-4 */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="rounded-lg md:rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 md:p-4 shadow-sm">
              <div className={`mb-2 inline-flex rounded-lg p-1.5 md:p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {value.toLocaleString("es-CO")}
              </p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
            </div>
          ))}
        </div>

      {/* Chart + Estado */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Actividad semanal */}
        <div className="rounded-lg md:rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">Actividad semanal</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Simulacros completados y nuevos registros</p>
            </div>
          </div>
          {simulacrosCompletados === 0 ? (
            <div className="flex h-24 md:h-32 items-center justify-center text-xs md:text-sm text-gray-400 dark:text-gray-500">
              Sin actividad registrada aún
            </div>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>

        {/* Estado del sistema */}
        <div className="rounded-lg md:rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm">
          <h2 className="mb-4 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">Estado del sistema</h2>
          <div className="space-y-3">
            <ProgressBar
              label="Estudiantes activos / total"
              value={suscripcionesActivas}
              max={estudiantesCount}
              display={`${suscripcionesActivas} / ${estudiantesCount}`}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Tasa de aprobación general"
              value={promedioGeneral}
              max={500}
              display={`${promedioGeneral > 0 ? Math.round((promedioGeneral / 500) * 100) : 0}%`}
              color="bg-green-500"
            />
            <ProgressBar
              label="Promedio general del sistema"
              value={promedioGeneral}
              max={500}
              display={`${promedioGeneral} pts`}
              color="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Validaciones pendientes */}
      {pendingValidations.length > 0 && (
        <div className="rounded-lg md:rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">Validaciones pendientes</h2>
            <Link href="/admin/suscripciones" className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {pendingValidations.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="flex h-7 w-7 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300">
                    {getInitials(u.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.nombre}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                      {u.email} · {new Date(u.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  {u.suscripcion?.plan?.nombre && (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 md:px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 flex-shrink-0">
                      {u.suscripcion.plan.nombre}
                    </span>
                  )}
                  <button className="rounded-lg bg-green-100 dark:bg-green-900/30 px-2.5 md:px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-200 transition flex-shrink-0">
                    Aprobar
                  </button>
                  <button className="rounded-lg bg-red-100 dark:bg-red-900/30 px-2.5 md:px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-200 transition flex-shrink-0">
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}