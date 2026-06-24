/**
 * Tipos para modelo de calificación ICFES
 * - Escala 0-500 (vs 0-100 en TRI simple)
 * - 5 áreas de conocimiento
 * - Ranking y percentil por grupo
 */

export const ICFES_AREAS = [
  "LECTURA CRITICA",
  "MATEMATICAS",
  "CIENCIAS NATURALES",
  "SOCIALES Y CIUDADANAS",
  "INGLES",
] as const;

export type IcfesArea = (typeof ICFES_AREAS)[number];

export interface ScoreAreas {
  "LECTURA CRITICA": number;
  "MATEMATICAS": number;
  "CIENCIAS NATURALES": number;
  "SOCIALES Y CIUDADANAS": number;
  "INGLES": number;
}

export interface StudentScoreReport {
  estudianteId: string;
  nombreEstudiante?: string;
  puntajeTRI: number; // 0-500 (escala ICFES)
  puntajePorArea: ScoreAreas;
  ranking: number; // Posición en el grupo (1 = mejor)
  percentil: number; // 0-100
}

export interface GroupScoreStatistics {
  total: number; // Total de estudiantes
  promedio: number;
  desviacionEstandar: number;
  minimo: number;
  maximo: number;
  mediana: number;
  q1: number; // Cuartil 1
  q3: number; // Cuartil 3
}

export interface ExamAreaReport {
  examenId: string;
  area: IcfesArea;
  promedio: number;
  desviacionEstandar: number;
  mejorPuntaje: number;
  peorPuntaje: number;
}
