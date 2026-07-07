// app/developer/simulacros/page.tsx
import { ModuloSimulacros } from "@/components/developer/modulos/ModuloSimulacros";

export const metadata = { title: "Simulacros | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperSimulacrosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloSimulacros />
      </div>
    </div>
  );
}
