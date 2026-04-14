// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind de forma segura */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un puntaje ICFES */
export function formatPuntaje(puntaje: number): string {
  return new Intl.NumberFormat("es-CO").format(puntaje);
}

/** Calcula el tiempo restante en formato HH:MM:SS */
export function formatTiempo(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}
