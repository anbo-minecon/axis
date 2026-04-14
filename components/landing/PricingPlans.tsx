"use client";

import Link from "next/link";
import { useState } from "react";

export function PricingPlans() {
  const plans = [
    {
      nombre: "Básico",
      precio: "Gratis",
      color: "from-blue-500 to-blue-600",
      features: [
        "3 simulacros por mes",
        "Acceso a 2 áreas (Matemáticas, Lectura Crítica)",
        "Resultados básicos",
        "Soporte por email",
      ],
      cta: "Empezar gratis",
      href: "/auth/registro",
      destacado: false,
    },
    {
      nombre: "Premium",
      precio: "$150.000",
      subprecio: "pesos/mes",
      color: "from-amber-500 to-orange-600",
      features: [
        "Simulacros ilimitados",
        "Todas las áreas ICFES",
        "Análisis detallado y estadísticas",
        "Ranking nacional",
        "Flashcards de repaso interactivas",
        "Soporte prioritario",
      ],
      cta: "Comenzar Premium",
      href: "/auth/registro",
      destacado: true,
    },
    {
      nombre: "Institucional",
      precio: "Personalizado",
      color: "from-green-500 to-emerald-600",
      features: [
        "Acceso ilimitado para toda la institución",
        "Panel de administración",
        "Reportes personalizados por estudiante",
        "Integración con sistemas académicos",
        "Soporte dedicado 24/7",
        "Capacitación gratuita",
      ],
      cta: "Contactar ventas",
      href: "mailto:ventas@axispreicfes.com",
      destacado: false,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Planes y precios</h2>
          <p className="text-xl text-gray-600">Elige el plan que mejor se ajuste a tus necesidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-4">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden transition-transform hover:scale-105 ${
                plan.destacado ? "md:scale-105 md:shadow-2xl" : "shadow-lg"
              }`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.color}`}></div>

              {/* Highlighted badge */}
              {plan.destacado && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-2 font-bold text-sm rounded-bl-lg">
                  Más popular
                </div>
              )}

              {/* Content */}
              <div className="relative p-8 text-white h-full flex flex-col">
                <h3 className="text-2xl font-bold mb-2">{plan.nombre}</h3>
                <div className="mb-6">
                  <div className="text-5xl font-bold">{plan.precio}</div>
                  {plan.subprecio && <div className="text-white text-opacity-80 text-sm">{plan.subprecio}</div>}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-3">
                      <span className="text-yellow-300 font-bold text-xl">✓</span>
                      <span className="text-white text-opacity-90">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-lg font-bold text-center transition-all ${
                    plan.destacado
                      ? "bg-white text-gray-900 hover:bg-yellow-100"
                      : "bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
