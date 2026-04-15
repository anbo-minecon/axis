import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "plan",
      title: "Regístrate",
      description: "Crea tu cuenta con los datos básicos",
    },
    {
      num: "02",
      icon: "rankings",
      title: "Activa tu plan",
      description: "Elige el plan que mejor se ajuste a tu necesidad",
    },
    {
      num: "03",
      icon: "simulacros",
      title: "Presenta simulacros",
      description: "Realiza simulacros y recibe retroalimentación instantánea",
    },
    {
      num: "04",
      icon: "analytics",
      title: "Analiza resultados",
      description: "Revisa estadísticas, ranking y mejora continua",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">¿Cómo funciona?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">4 pasos simples para começar tu preparación</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector line (hidden on mobile, shown on md+) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-1 bg-blue-200 dark:bg-blue-700 transform -translate-y-1/2"></div>
              )}

              <div className="relative bg-gradient-to-br from-blue-50 dark:from-gray-800 to-blue-100 dark:to-gray-700 rounded-xl p-8 text-center border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full font-bold text-2xl mb-4 mx-auto">
                  {step.num}
                </div>
                <div className="text-blue-600 dark:text-blue-400 mb-3 flex justify-center">
                  <FeatureIcon type={step.icon} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
