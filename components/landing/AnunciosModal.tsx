"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Anuncio {
  id: string;
  titulo: string;
  imagenUrl: string;
  linkUrl: string | null;
}

interface AnunciosModalProps {
  anuncios: Anuncio[];
}

export function AnunciosModal({ anuncios }: AnunciosModalProps) {
  const [abierto, setAbierto] = useState(anuncios.length > 0);
  const [actual, setActual] = useState(0);
  const total = anuncios.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const anuncio = anuncios[actual];

  const lineaTitulo = useMemo(() => {
    if (!anuncio) return "";
    return anuncio.titulo || "Anuncio";
  }, [anuncio]);

  // Carrusel automático cada 5 segundos si hay más de un anuncio
  useEffect(() => {
    if (abierto && total > 1) {
      intervalRef.current = setInterval(() => {
        setActual((prev) => (prev + 1) % total);
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [abierto, total]);

  if (!abierto || total === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 shadow-2xl">
        <button
          onClick={() => setAbierto(false)}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-white transition hover:bg-slate-800"
          aria-label="Cerrar anuncios"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden bg-black/10">
            <img
              src={anuncio.imagenUrl}
              alt={lineaTitulo}
              className="h-full min-h-[320px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 space-y-4 text-white">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-300">
                <span>{actual + 1} / {total}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>Anuncio destacado</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{lineaTitulo}</h2>
              {anuncio.linkUrl && (
                <a
                  href={anuncio.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
                >
                  Ver más
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-slate-950/95 p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Anuncios AXIS</p>
                <p className="mt-3 text-lg leading-8 text-slate-200">
                  Aquí mostramos el material más relevante para visitantes y nuevos usuarios.
                  Cierra este modal cuando quieras y explora la landing con normalidad.
                </p>
              </div>

              <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
                <p className="font-semibold text-white">Este anuncio está en vivo en la landing.</p>
                <p className="leading-6">
                  Usa el botón de cierre para volver a la página. Si el anuncio incluye enlace, puede abrirse en una pestaña nueva.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <div className="flex flex-1 items-center gap-3">
                <button
                  onClick={() => setActual((actual - 1 + total) % total)}
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10",
                    total === 1 && "opacity-40 cursor-not-allowed"
                  )}
                  disabled={total === 1}
                  aria-label="Anuncio anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActual((actual + 1) % total)}
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10",
                    total === 1 && "opacity-40 cursor-not-allowed"
                  )}
                  disabled={total === 1}
                  aria-label="Anuncio siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() => setAbierto(false)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
              >
                Cerrar anuncio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
