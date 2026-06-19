// app/docente/perfil/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PerfilForm } from "@/components/shared/PerfilForm";

export const metadata = { title: "Mi Perfil | Docente AXIS" };
export const dynamic = "force-dynamic";

export default async function PerfilDocentePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (session.user.rol !== "DOCENTE") redirect("/dashboard");

  return <PerfilForm rol="DOCENTE" />;
}