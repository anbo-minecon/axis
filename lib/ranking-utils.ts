import { db } from "@/lib/db";
import { GroupScoreStatistics } from "@/types/icfes";

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  if (len === 0) return 0;
  const mid = Math.floor(len / 2);
  return len % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function quartiles(values: number[]): { q1: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  if (len === 0) return { q1: 0, q3: 0 };
  const mid = Math.floor(len / 2);
  const lower = sorted.slice(0, mid);
  const upper = len % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return {
    q1: median(lower),
    q3: median(upper),
  };
}

function percentilFromPos(pos: number, total: number) {
  if (total <= 1) return 100;
  return Math.round((1 - (pos - 1) / (total - 1)) * 100);
}

export async function calcularRanking(examenId: string) {
  const resultados = await db.resultadoSimulacro.findMany({
    where: {
      examenId,
      puntajeTRI: { not: null },
    },
    select: {
      id: true,
      puntajeTRI: true,
    },
  });

  if (resultados.length === 0) return;

  const sorted = [...resultados].sort((a, b) => Number(b.puntajeTRI) - Number(a.puntajeTRI));
  let posicion = 1;

  const ranked = sorted.map((r, index) => {
    if (index > 0 && Number(r.puntajeTRI) < Number(sorted[index - 1].puntajeTRI)) {
      posicion = index + 1;
    }
    return { id: r.id, ranking: posicion };
  });

  await Promise.all(ranked.map(({ id, ranking }) =>
    db.resultadoSimulacro.update({ where: { id }, data: { ranking } }),
  ));
}

export async function calcularPercentil(examenId: string) {
  const resultados = await db.resultadoSimulacro.findMany({
    where: {
      examenId,
      puntajeTRI: { not: null },
    },
    select: {
      id: true,
      ranking: true,
    },
  });

  if (resultados.length === 0) return;

  const total = resultados.length;
  const percentiles = resultados.map((r) => ({
    id: r.id,
    percentil: percentilFromPos(r.ranking ?? total, total),
  }));

  await Promise.all(percentiles.map(({ id, percentil }) =>
    db.resultadoSimulacro.update({ where: { id }, data: { percentil } }),
  ));
}

export async function calcularEstadisticasGrupo(examenId: string): Promise<GroupScoreStatistics> {
  const resultados = await db.resultadoSimulacro.findMany({
    where: {
      examenId,
      puntajeTRI: { not: null },
    },
    select: { puntajeTRI: true },
  });

  const scores = resultados.map((r) => Number(r.puntajeTRI));
  const total = scores.length;
  const promedio = total === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / total;
  const minimo = total === 0 ? 0 : Math.min(...scores);
  const maximo = total === 0 ? 0 : Math.max(...scores);
  const mediana = median(scores);
  const { q1, q3 } = quartiles(scores);
  const desviacionEstandar = total === 0
    ? 0
    : Math.sqrt(scores.reduce((sum, x) => sum + Math.pow(x - promedio, 2), 0) / total);

  return {
    total,
    promedio: Number(promedio.toFixed(2)),
    desviacionEstandar: Number(desviacionEstandar.toFixed(2)),
    minimo,
    maximo,
    mediana: Number(mediana.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
  };
}
