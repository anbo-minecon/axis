// app/developer/usuarios/page.tsx
import { ModuloUsuarios } from "@/components/developer/modulos/ModuloUsuarios";

export const metadata = { title: "Usuarios | AXIS Developer" };
export const dynamic = "force-dynamic";

export default function DeveloperUsuariosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ModuloUsuarios />
      </div>
    </div>
  );
}
