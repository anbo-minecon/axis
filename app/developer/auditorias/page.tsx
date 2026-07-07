// app/developer/auditorias/page.tsx
import { ModuloAuditorias } from "@/components/developer/modulos/ModuloAuditorias";

export const metadata = { title: "Auditorías | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperAuditoriasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloAuditorias />
      </div>
    </div>
  );
}
