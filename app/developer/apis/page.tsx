// app/developer/apis/page.tsx
import { ModuloAPIs } from "@/components/developer/modulos/ModuloAPIs";

export const metadata = { title: "APIs | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperAPIsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloAPIs />
      </div>
    </div>
  );
}
