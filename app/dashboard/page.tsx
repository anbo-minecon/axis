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
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

/* ── Tipos ───────────────────────────────────────── */
interface DashboardStats {
  simulacrosCompletados: number;
  puntajeMasAlto: number;
  posicionRanking: number;
  promedioGeneral: number;
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
  // TODO: Ajustar nombres de modelos Prisma según tu schema.prisma
  // Los intentos y simulacros son el núcleo de estas consultas

  try {
    // Intentos completados del usuario
    const intentos = await db.intento.findMany({
      where: {
        usuarioId: userId,
        estado: "completado",
      },
      include: {
        simulacro: {
          select: { nombre: true, totalPreguntas: true },
        },
        respuestasUser: {
          include: {
            opcion: { select: { esCorrecta: true } },
          },
        },
      },
      orderBy: { fechaFin: "desc" },
    });

    // Calcular puntaje de cada intento (aciertos / total * 500)
    const intentosConPuntaje = intentos.map((intento) => {
      const aciertos = intento.respuestasUser.filter(
        (r) => r.opcion?.esCorrecta
      ).length;
      const total = intento.simulacro?.totalPreguntas ?? 1;
      const puntaje = Math.round((aciertos / total) * 500);
      return { ...intento, puntaje };
    });

    const puntajeMasAlto = intentosConPuntaje.length
      ? Math.max(...intentosConPuntaje.map((i) => i.puntaje))
      : 0;

    const promedioGeneral = intentosConPuntaje.length
      ? Math.round(
          intentosConPuntaje.reduce((sum, i) => sum + i.puntaje, 0) /
            intentosConPuntaje.length
        )
      : 0;

    // Últimos 3 para "actividad reciente"
    const recientes: SimulacroReciente[] = intentosConPuntaje
      .slice(0, 3)
      .map((i) => ({
        id: i.id,
        nombre: i.simulacro?.nombre ?? "Simulacro",
        puntaje: i.puntaje,
        nivel: i.puntaje >= 400 ? "Alto" : i.puntaje >= 250 ? "Medio" : "Bajo",
        fecha: i.fechaFin
          ? new Date(i.fechaFin).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "",
      }));

    // Próximos simulacros disponibles (no intentados)
    const todosSimulacros = await db.simulacro.findMany({
      take: 3,
      orderBy: { fechaCreacion: "desc" },
      select: { id: true, nombre: true, fechaCreacion: true },
    });

    const intentadosIds = new Set(intentos.map((i) => i.simulacroId));
    const proximos: ProximoSimulacro[] = todosSimulacros
      .filter((s) => !intentadosIds.has(s.id))
      .slice(0, 2)
      .map((s) => ({
        id: s.id,
        nombre: s.nombre,
        fecha: new Date(s.fechaCreacion).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        materia: s.nombre.split("–")[1]?.trim() ?? "General",
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

    return {
      stats: {
        simulacrosCompletados: intentos.length,
        puntajeMasAlto,
        posicionRanking: 0, // TODO: calcular ranking real
        promedioGeneral,
      } as DashboardStats,
      recientes,
      proximos,
      grupo,
    };
  } catch (error) {
    // Si los modelos aún no existen, retornar datos vacíos
    console.error("[Dashboard] Error fetching data:", error);
    return {
      stats: {
        simulacrosCompletados: 0,
        puntajeMasAlto: 0,
        posicionRanking: 0,
        promedioGeneral: 0,
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
          <span className="text-2xl font-bold text-gray-800">{puntaje}</span>
          <span className="text-xs text-gray-500">/ 500</span>
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
      <span className="w-36 shrink-0 text-sm text-gray-600">{materia}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2.5">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="w-9 text-right text-sm font-medium text-gray-700">
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

  // Rendimiento por materia (placeholder hasta integrar estadísticas reales)
  // TODO: calcular desde respuestasUser agrupando por materia
  const rendimientoMateria = [
    { materia: "Matemáticas",        porcentaje: 84 },
    { materia: "Lectura Crítica",    porcentaje: 76 },
    { materia: "Ciencias Naturales", porcentaje: 62 },
    { materia: "Sociales",           porcentaje: 71 },
    { materia: "Inglés",             porcentaje: 55 },
  ];

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* ── Saludo ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {nombre}! 👋
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está tu resumen de preparación para el Saber 11.
        </p>
      </div>

      {/* ── Tarjeta de grupo ── */}
      {grupo && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Trophy className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">{grupo.nombre}</p>
              <p className="text-xs text-blue-600">Prof. {grupo.docente}</p>
            </div>
          </div>
          <Link
            href={`/dashboard/grupo`}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
          >
            Ver grupo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Puntaje + Rendimiento ── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Puntaje actual */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            Puntaje actual
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Último simulacro (escala 0–500)
          </p>
          <div className="flex justify-center">
            <PuntajeCircular puntaje={stats.puntajeMasAlto} />
          </div>
        </div>

        {/* Rendimiento por materia */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            Rendimiento por materia
          </h2>
          <p className="mb-4 text-xs text-gray-400">Porcentaje de aciertos</p>
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
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Actividad reciente
            </h2>
            <Link
              href="/dashboard/resultados"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {recientes.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              Aún no has completado simulacros
            </p>
          ) : (
            <div className="space-y-3">
              {recientes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {s.nombre}
                      </p>
                      <p className="text-xs text-gray-400">{s.fecha}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{s.puntaje}</p>
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
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Próximos simulacros
            </h2>
            <Link
              href="/dashboard/simulacros"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {proximos.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No hay simulacros pendientes
            </p>
          ) : (
            <div className="space-y-3">
              {proximos.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {s.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.fecha} · {s.materia}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/simulacros/${s.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Ir →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Aviso cuadernillo */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <span className="text-xs text-blue-600">
              📄 Recuerda tener el cuadernillo PDF antes de iniciar el simulacro.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}