"use client";

import { useState } from "react";

export function FAQ() {
  const [expanded, setExpanded] = useState<number | null>(0);

  const faqs = [
    {
      pregunta: "¿Cómo accedo al plataforma después de registrarme?",
      respuesta: "Después de completar tu registro, recibirás un correo de confirmación. Una vez confirmes tu email, tendrás acceso inmediato a tu cuenta y podrás comenzar los simulacros.",
    },
    {
      pregunta: "¿Las preguntas están en la plataforma como en el ICFES real?",
      respuesta: "Sí, nuestros simulacros están diseñados idénticamente al examen ICFES oficial en estructura, dificultad y cantidad de preguntas. Incluso puedes configurar la duración según el tipo.",
    },
    {
      pregunta: "¿Cómo es calificado el simulacro?",
      respuesta: "El sistema califica automáticamente tu simulacro y te proporciona un análisis detallado por área, tipo de pregunta y nivel de dificultad, junto con recomendaciones de estudio.",
    },
    {
      pregunta: "¿Puedo descargar mis resultados?",
      respuesta: "Sí, puedes descargar tu reporte completo en PDF con gráficos, análisis y recomendaciones de estudio personalizadas.",
    },
    {
      pregunta: "¿Hay límite de simulacros que puedo hacer?",
      respuesta: "En el plan básico hay límite (3 por mes), pero en Premium tienes simulacros ilimitados. Además, puedes hacer prácticas rápidas de áreas específicas sin límite.",
    },
    {
      pregunta: "¿Puedo cambiar de plan en cualquier momento?",
      respuesta: "Sí, puedes cambiar o cancelar tu plan en cualquier momento. Si cambias a un plan superior, se prorratearán los días restantes.",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Preguntas Frecuentes</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Resolvemos tus dudas más comunes</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <button
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white text-left">{faq.pregunta}</span>
                <span
                  className={`ml-2 text-blue-600 dark:text-blue-400 text-2xl transition-transform ${
                    expanded === idx ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expanded === idx && (
                <div className="px-6 py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
                  {faq.respuesta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
