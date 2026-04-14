// types/index.ts

export type RolUsuario = "ESTUDIANTE" | "DOCENTE" | "ADMIN";
export type TipoSimulacro = "COMPLETO" | "POR_AREA" | "PRACTICA_RAPIDA";
export type EstadoSimulacro = "EN_PROGRESO" | "FINALIZADO" | "ABANDONADO";

export interface ResultadoArea {
  areaId: string;
  areaNombre: string;
  correctas: number;
  total: number;
  puntaje: number;
  porcentaje: number;
}

export interface ResumenSimulacro {
  id: string;
  puntajeTotal: number;
  fechaFin: Date;
  duracionMinutos: number;
  resultadosPorArea: ResultadoArea[];
  percentilNacional?: number;
}
