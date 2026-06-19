// app/developer/perfil/page.tsx
import { DeveloperDashboard } from "@/components/developer/DeveloperDashboard";

export const metadata = { title: "Mi Perfil | Developer AXIS" };

export default function PerfilDeveloperPage() {
  // Deep link: abre el mismo dashboard de developer (mismo sidebar,
  // mismo shell) directamente en la pestaña "Mi Perfil".
  return <DeveloperDashboard initialTab="perfil" />;
}