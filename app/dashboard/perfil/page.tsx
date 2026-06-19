// app/dashboard/perfil/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PerfilForm } from "@/components/shared/PerfilForm";

export const metadata = { title: "Mi Perfil | AXIS Pre-ICFES" };
export const dynamic = "force-dynamic";

export default async function PerfilEstudiantePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  // Cada rol tiene su propia zona de perfil con su propio shell
  if (session.user.rol === "DOCENTE") redirect("/docente/perfil");
  if (session.user.rol === "ADMIN") redirect("/admin/perfil");
  if (session.user.rol === "DEVELOPER") redirect("/developer/perfil");

  return <PerfilForm rol="ESTUDIANTE" />;
}