// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SuscripcionInactiva } from "@/components/dashboard/SuscripcionInactiva";
import Link from "next/link";
import {
  ClipboardList,
  TrendingUp,
  Trophy,
  BarChart2,
  Clock,
  Globe,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ── Tipos ───────────────────────────────────────── */
interface RendimientoMateria {
  materia: string;
  porcentaje: number;
}

interface DashboardStats {
  simulacrosCompletados: number;
  puntajeMasAlto: number;
  posicionRanking: number;
  percentilActual: number;
  promedioGeneral: number;
  rendimientoMateria: RendimientoMateria[];
}

interface SimulacroReciente {
  id: string;
  nombre: string;
  puntaje: number;
  nivel: "Alto" | "Medio" | "Bajo";
  fecha: string;
}

interface ProximoSimulacro {
  id: string;
  nombre: string;
  fecha: string;
  materia: string;
}

interface GrupoData {
  id: string;
  nombre: string;
  horario: string;
  docente: string;
}

/* ── Colores por materia ─────────────────────────── */
const COLORES_MATERIA: Record<string, string> = {
  "Matemáticas":       "bg-blue-500",
  "Lectura Crítica":   "bg-purple-500",
  "Ciencias Naturales":"bg-green-500",
  "Sociales":          "bg-amber-500",
  "Inglés":            "bg-pink-500",
};

/* ── Color de nivel ──────────────────────────────── */
function nivelColor(nivel: string) {
  if (nivel === "Alto")  return "bg-green-100 text-green-700";
  if (nivel === "Medio") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

/* ── Fetch de datos del dashboard ────────────────── */
async function fetchDashboardData(userId: string) {
  try {
    // Resultados completados del usuario usando ResultadoSimulacro
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where: { estudianteId: userId },
      include: {
        examen: {
          select: { nombre: true, materia: true, totalPreguntas: true },
        },
      },
      orderBy: { completadoEn: "desc" },
    });

    const recalcularPreliminar = (aciertos: number, total: number) => {
      if (total <= 0) return 0;
      return Math.round(Math.pow(aciertos / total, 1.5) * 100);
    };

    const calcularPuntajeEfectivo = (r: any) => {
      if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
        return Math.round(Number(r.puntajeTRI));
      if ((r.puntajePreliminar ?? 0) > 0)
        return Math.round(r.puntajePreliminar ?? 0);
      if ((r.aciertos ?? 0) > 0 && (r.total ?? 0) > 0)
        return recalcularPreliminar(r.aciertos, r.total);
      const proporcion = r.total > 0 ? (r.puntaje ?? 0) / r.total : 0;
      return Math.round(proporcion * 100);
    };

    const resultadosConPuntaje = resultados.map((r: any) => {
      const porcentaje = calcularPuntajeEfectivo(r);
      return {
        ...r,
        porcentaje,
        puntajeEscalado: Math.round((porcentaje / 100) * 500),
      };
    });

    const puntajeMasAlto = resultadosConPuntaje.length
      ? Math.max(...resultadosConPuntaje.map((r: any) => r.puntajeEscalado))
      : 0;

    const promedioGeneral = resultadosConPuntaje.length
      ? Math.round(
          resultadosConPuntaje.reduce((sum: number, r: any) => sum + r.puntajeEscalado, 0) /
            resultadosConPuntaje.length
        )
      : 0;

    const rendimientoMateria = Object.entries(
      resultadosConPuntaje.reduce((acc: Record<string, { sum: number; count: number }>, r: any) => {
        const materia = r.examen?.materia ?? "Multi-materia";
        if (!acc[materia]) acc[materia] = { sum: 0, count: 0 };
        acc[materia].sum += r.porcentaje;
        acc[materia].count += 1;
        return acc;
      }, {})
    ).map(([materia, data]: [string, any]) => ({
      materia,
      porcentaje: Math.round(data.sum / data.count),
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

    // Últimos 3 resultados para "actividad reciente"
    const recientes: SimulacroReciente[] = resultadosConPuntaje
      .slice(0, 3)
      .map((r: any, idx: number) => ({
        id: r.id,
        nombre: r.examen.nombre || `Simulacro ${idx + 1}`,
        puntaje: r.puntajeEscalado,
        nivel: r.puntajeEscalado >= 400 ? "Alto" : r.puntajeEscalado >= 250 ? "Medio" : "Bajo",
        fecha: new Date(r.completadoEn).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));

    // Próximos simulacros disponibles (no completados)
    const todosExamenes = await (db as any).examenTemplate.findMany({
      where: { estado: "PUBLICADO" },
      select: { id: true, nombre: true, materia: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const completadosIds = new Set(resultados.map((r: any) => r.examenId));
    const proximos: ProximoSimulacro[] = todosExamenes
      .filter((e: any) => !completadosIds.has(e.id))
      .slice(0, 2)
      .map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        fecha: new Date().toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        materia: e.materia,
      }));

    // Grupo del usuario
    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      select: {
        grupo: {
          select: {
            id: true,
            nombre: true,
            municipio: true,
            docente: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    const grupo: GrupoData | null = usuario?.grupo
      ? {
          id: usuario.grupo.id,
          nombre: usuario.grupo.nombre,
          horario: "Ver detalles",
          docente: usuario.grupo.docente?.nombre ?? "—",
        }
      : null;

    const estudiantesRanking = await (db as any).usuario.findMany({
      where: { rol: "ESTUDIANTE" },
      select: {
        id: true,
        resultados: {
          where: { examen: { estado: { in: ["CERRADO", "PUBLICADO"] } } },
          select: {
            puntaje: true,
            total: true,
            puntajePreliminar: true,
            puntajeTRI: true,
            estadoCalif: true,
            aciertos: true,
          },
        },
      },
    });

    const rankingConPosicion = estudiantesRanking
      .map((e: any) => {
        const completados = e.resultados.length;
        if (completados === 0) return null;

        const puntajesEfectivos = e.resultados.map((r: any) => {
          if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
            return Number(r.puntajeTRI);
          if ((r.puntajePreliminar ?? 0) > 0)
            return Number(r.puntajePreliminar ?? 0);
          if ((r.aciertos ?? 0) > 0 && (r.total ?? 0) > 0)
            return recalcularPreliminar(r.aciertos, r.total);
          return r.total > 0 ? ((r.puntaje ?? 0) / r.total) * 100 : 0;
        });

        const promedioPorc = puntajesEfectivos.reduce((a: number, b: number) => a + b, 0) / puntajesEfectivos.length;
        return {
          id: e.id,
          puntajeEscalado: Math.round((promedioPorc / 100) * 500),
          simulacrosCompletados: completados,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (b.puntajeEscalado !== a.puntajeEscalado)
          return b.puntajeEscalado - a.puntajeEscalado;
        return b.simulacrosCompletados - a.simulacrosCompletados;
      });

    let posicion = 1;
    const rankingFinal = rankingConPosicion.map((e: any, i: number) => {
      if (i > 0 && e.puntajeEscalado < rankingConPosicion[i - 1].puntajeEscalado)
        posicion = i + 1;
      return { ...e, posicion };
    });

    const posicionRanking = rankingFinal.find((r: any) => r.id === userId)?.posicion ?? 0;
    const percentilActual = posicionRanking > 0 && rankingFinal.length > 1
      ? Math.round((1 - (posicionRanking - 1) / (rankingFinal.length - 1)) * 100)
      : posicionRanking > 0
        ? 100
        : 0;

    return {
      stats: {
        simulacrosCompletados: resultados.length,
        puntajeMasAlto,
        posicionRanking,
        percentilActual,
        promedioGeneral,
        rendimientoMateria,
      } as DashboardStats,
      recientes,
      proximos,
      grupo,
    };
  } catch (error) {
    console.error("[Dashboard] Error fetching data:", error);
    return {
      stats: {
        simulacrosCompletados: 0,
        puntajeMasAlto: 0,
        posicionRanking: 0,
        percentilActual: 0,
        promedioGeneral: 0,
        rendimientoMateria: [],
      },
      recientes: [],
      proximos: [],
      grupo: null,
    };
  }
}

/* ── Componente circular de puntaje ──────────────── */
function PuntajeCircular({ puntaje }: { puntaje: number }) {
  const max = 500;
  const radio = 54;
  const circunferencia = 2 * Math.PI * radio;
  const progreso = (puntaje / max) * circunferencia;
  const nivel =
    puntaje >= 400 ? "Nivel Alto" : puntaje >= 250 ? "Nivel Medio" : "Nivel Bajo";
  const nivelBg =
    puntaje >= 400
      ? "bg-green-100 text-green-700"
      : puntaje >= 250
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Pista */}
          <circle
            cx="70" cy="70" r={radio}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
          />
          {/* Progreso */}
          <circle
            cx="70" cy="70" r={radio}
            fill="none"
            stroke="#2563eb"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia - progreso}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">{puntaje}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/ 500</span>
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${nivelBg}`}>
        {nivel}
      </span>
    </div>
  );
}

/* ── Barra de rendimiento por materia ────────────── */
function BarraMateria({
  materia,
  porcentaje,
}: {
  materia: string;
  porcentaje: number;
}) {
  const color = COLORES_MATERIA[materia] ?? "bg-gray-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-sm text-gray-600 dark:text-gray-400">{materia}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 h-2.5">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="w-9 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
        {porcentaje}%
      </span>
    </div>
  );
}

/* ── Página ──────────────────────────────────────── */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const { tieneSubscripcion, name } = session.user;
  const nombre = name?.split(" ")[0] ?? "Estudiante";

  // Sin suscripción → pantalla de aviso
  if (!tieneSubscripcion) {
    return <SuscripcionInactiva />;
  }

  const { stats, recientes, proximos, grupo } =
    await fetchDashboardData(session.user.id);

  const rendimientoMateria = stats.rendimientoMateria;

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* ── Saludo ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ¡Hola, {nombre}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aquí está tu resumen de preparación para el Saber 11.
        </p>
      </div>

      {/* ── Tarjeta de grupo ── */}
      {grupo && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{grupo.nombre}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Prof. {grupo.docente}</p>
            </div>
          </div>
          <Link
            href={`/dashboard/grupo`}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
          >
            Ver grupo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Simulacros completados",
            value: stats.simulacrosCompletados,
            icon: ClipboardList,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Puntaje más alto",
            value: stats.puntajeMasAlto,
            icon: TrendingUp,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Posición en ranking",
            value: stats.posicionRanking > 0 ? `#${stats.posicionRanking}` : "—",
            icon: Trophy,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Promedio general",
            value: stats.promedioGeneral,
            icon: BarChart2,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Percentil actual",
            value: stats.posicionRanking > 0 ? `${stats.percentilActual}º` : "—",
            icon: Globe,
            color: "text-cyan-600 bg-cyan-50",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-md"
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Puntaje + Rendimiento ── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Puntaje actual */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md">
          <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Puntaje actual
          </h2>
          <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
            Último simulacro (escala 0–500)
          </p>
          <div className="flex justify-center">
            <PuntajeCircular puntaje={stats.puntajeMasAlto} />
          </div>
        </div>

        {/* Rendimiento por materia */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md">
          <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Rendimiento por materia
          </h2>
          <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">Porcentaje de aciertos</p>
          <div className="space-y-3">
            {rendimientoMateria.map(({ materia, porcentaje }) => (
              <BarraMateria
                key={materia}
                materia={materia}
                porcentaje={porcentaje}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Actividad reciente + Próximos simulacros ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Actividad reciente */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Actividad reciente
            </h2>
            <Link
              href="/dashboard/resultados"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {recientes.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              Aún no has completado simulacros
            </p>
          ) : (
            <div className="space-y-3">
              {recientes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {s.nombre}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.fecha}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{s.puntaje}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${nivelColor(s.nivel)}`}
                    >
                      {s.nivel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos simulacros */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Próximos simulacros
            </h2>
            <Link
              href="/dashboard/simulacros"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {proximos.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              No hay simulacros pendientes
            </p>
          ) : (
            <div className="space-y-3">
              {proximos.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {s.nombre}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {s.fecha} · {s.materia}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/simulacros/${s.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    Ir →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Aviso cuadernillo */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              📄 Recuerda tener el cuadernillo PDF antes de iniciar el simulacro.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}