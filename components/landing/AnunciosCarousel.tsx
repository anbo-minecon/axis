// components/landing/AnunciosCarousel.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Anuncio {
  id: string;
  titulo: string;
  imagenUrl: string;
  linkUrl: string | null;
}

interface AnunciosCarouselProps {
  anuncios: Anuncio[];
}

// Avance automático cada 5 segundos
const INTERVALO_MS = 5000;

export function AnunciosCarousel({ anuncios }: AnunciosCarouselProps) {
  const [actual,   setActual]   = useState(0);
  const [animando, setAnimando] = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = anuncios.length;

  const irA = useCallback((idx: number) => {
    if (animando || idx === actual) return;
    setAnimando(true);
    setActual(idx);
    setTimeout(() => setAnimando(false), 600);
  }, [actual, animando]);

  const siguiente = useCallback(() => irA((actual + 1) % total), [actual, total, irA]);
  const anterior  = useCallback(() => irA((actual - 1 + total) % total), [actual, total, irA]);

  const reiniciarTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(siguiente, INTERVALO_MS);
  }, [siguiente]);

  useEffect(() => {
    reiniciarTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reiniciarTimer]);

  if (total === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
      // Altura estilo MercadoLibre: compacta en móvil, más alta en desktop
      style={{ height: "clamp(160px, 28vw, 420px)" }}
      onMouseEnter={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
      onMouseLeave={reiniciarTimer}
    >
      {/* ── Slides ── */}
      {anuncios.map((a, i) => {
        const slide = (
          <img
            src={a.imagenUrl}
            alt={a.titulo}
            className={cn(
              "w-full h-full object-cover object-center select-none",
              i === actual 
                ? "animate-slideIn" 
                : "animate-slideOut"
            )}
            draggable={false}
          />
        );

        return (
          <div
            key={a.id}
            className={cn(
              "absolute inset-0",
              i === actual 
                ? "opacity-100 z-10 animate-fadeIn" 
                : "opacity-0 z-0 animate-fadeOut"
            )}
          >
            {a.linkUrl ? (
              <a
                href={a.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
                onClick={(e) => { if (animando) e.preventDefault(); }}
                title={a.titulo}
              >
                {slide}
              </a>
            ) : (
              slide
            )}
          </div>
        );
      })}

      {/* ── Sombras laterales para los botones ── */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/20 to-transparent z-20 pointer-events-none" />

      {/* ── Botón anterior ── */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); anterior(); reiniciarTimer(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 shadow hover:bg-white dark:hover:bg-gray-700 transition backdrop-blur-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* ── Botón siguiente ── */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); siguiente(); reiniciarTimer(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 shadow hover:bg-white dark:hover:bg-gray-700 transition backdrop-blur-sm"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* ── Dots de navegación ── */}
      {total > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {anuncios.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); irA(i); reiniciarTimer(); }}
              aria-label={`Ir al anuncio ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 shadow-sm",
                i === actual
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"
              )}
            />
          ))}
        </div>
      )}

      {/* ── Barra de progreso ── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 z-30">
        <div
          key={actual}
          className="h-full bg-blue-500/70"
          style={{ animation: `progressBar ${INTERVALO_MS}ms linear forwards` }}
        />
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .animate-slideIn {
          animation: slideIn 600ms ease-out forwards;
        }

        .animate-slideOut {
          animation: slideOut 600ms ease-in forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 600ms ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 600ms ease-in forwards;
        }

        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}