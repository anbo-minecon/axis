// app/dashboard/planes/page.tsx
"use client";

import { useUser } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Check } from "lucide-react";
import { useState } from "react";

const planesData = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "Gratis",
    precioMensual: "$0",
    duracion: "Acceso Permanente",
    descripcion: "Plan gratuito con acceso limitado",
    caracteristicas: [
      "2 simulacros por mes",
      "Acceso a documentos básicos",
      "Visualización de ranking",
      "Soporte por email",
    ],
    noIncluye: [
      "Simulacros ilimitados",
      "Análisis detallado de resultados",
      "Grupo de estudio privado",
      "Reportes semanales",
      "Mentoría personalizada",
    ],
    cta: "Tu plan actual",
    ctaStyle: "secondary",
    popular: false,
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$29.990",
    precioMensual: "Por 3 meses",
    duracion: "Trimestral",
    descripcion: "Para estudiantes dedicados",
    caracteristicas: [
      "✓ Simulacros ilimitados",
      "✓ Acceso a todos los materiales",
      "✓ Análisis detallado de resultados",
      "✓ Grupo de estudio privado",
      "✓ Reportes semanales",
      "✓ Soporte prioritario",
    ],
    noIncluye: ["Mentoría 1 a 1", "Acceso prioritario a nuevas funciones"],
    cta: "Contratar Plan Pro",
    ctaStyle: "primary",
    popular: true,
  },
  {
    id: "premium",
    nombre: "Premium",
    precio: "$49.990",
    precioMensual: "Por 6 meses",
    duracion: "Semestral",
    descripcion: "Plan completo con ventajas exclusivas",
    caracteristicas: [
      "✓ Todo incluido en Pro",
      "✓ Mentoría 1 a 1 con expertos",
      "✓ Acceso prioritario a nuevas funciones",
      "✓ Descuentos en otros servicios",
      "✓ Certificado de finalización",
      "✓ Acceso a comunidad exclusiva",
    ],
    noIncluye: [],
    cta: "Contratar Plan Premium",
    ctaStyle: "primary",
    popular: false,
  },
];

export default function PlanesPage() {
  const { user, isLoading } = useUser();
  const [procesando, setProcesando] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-axis-azul border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando planes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nuestros Planes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades de preparación
            para el Saber 11
          </p>
        </div>

        {/* Planes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planesData.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all ${ plan.popular
                  ? "border-axis-azul shadow-2xl transform md:scale-105"
                  : "border-gray-200 shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-axis-azul to-axis-azul-dark text-white py-2 text-center text-sm font-bold">
                  🌟 MÁS POPULAR
                </div>
              )}

              <div className={`p-8 ${plan.popular ? "pt-16" : ""}`}>
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-6">{plan.descripcion}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.precio}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.precioMensual}</p>
                  <p className="text-xs text-gray-500 mt-2">{plan.duracion}</p>
                </div>

                {/* CTA Button */}
                <button
                  disabled={procesando}
                  className={`w-full py-3 rounded-lg font-semibold transition mb-8 ${
                    plan.ctaStyle === "primary"
                      ? "bg-gradient-to-r from-axis-azul to-axis-azul-dark text-white hover:shadow-lg"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Incluido:
                  </p>
                  {plan.caracteristicas.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{feature}</p>
                    </div>
                  ))}

                  {/* No Incluído */}
                  {plan.noIncluye.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-gray-900 mt-6">
                        No incluido:
                      </p>
                      {plan.noIncluye.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 opacity-50">
                          <p className="text-sm text-gray-600">{feature}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-6">
            {[
              {
                pregunta: "¿Puedo cambiar de plan en cualquier momento?",
                respuesta:
                  "Sí, puedes cambiar de plan en cualquier momento. Los cambios se aplicarán en el próximo período de facturación.",
              },
              {
                pregunta: "¿Hay descuentos para pagos anuales?",
                respuesta:
                  "Sí, ofrecemos descuentos especiales para pagos anuales. Contáctanos para más información.",
              },
              {
                pregunta: "¿Qué pasa si no estoy satisfecho?",
                respuesta:
                  "Ofrecemos una garantía de satisfacción de 7 días. Si no estás satisfecho, te devolvemos tu dinero sin preguntas.",
              },
              {
                pregunta: "¿Los precios incluyen IVA?",
                respuesta:
                  "Los precios mostrados no incluyen IVA. El IVA se añadirá al momento de la compra según tu ubicación.",
              },
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="fonts font-semibold text-gray-900 mb-2">
                  {item.pregunta}
                </h3>
                <p className="text-gray-600">{item.respuesta}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="bg-gradient-to-r from-axis-azul to-axis-azul-dark rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">¿Necesitas ayuda?</h3>
          <p className="mb-6">
            Nuestro equipo de soporte está disponible para ayudarte
          </p>
          <button className="bg-white text-axis-azul font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition">
            Contactar Soporte
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
