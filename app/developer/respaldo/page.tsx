// app/developer/respaldo/page.tsx
import { ModuloRespaldo } from "@/components/developer/modulos/ModuloRespaldo";

export const metadata = { title: "Respaldo | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperRespaldoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloRespaldo />
      </div>
    </div>
  );
}
