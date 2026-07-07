// app/developer/logs/page.tsx
import { ModuloLogs } from "@/components/developer/modulos/ModuloLogs";

export const metadata = { title: "Logs | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperLogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloLogs />
      </div>
    </div>
  );
}
