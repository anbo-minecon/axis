// app/developer/perfil/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeveloperPerfilForm } from "@/components/developer/DeveloperPerfilForm";

export const metadata = { title: "Mi Perfil | AXIS Developer" };
export const dynamic = "force-dynamic";

export default async function DeveloperPerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  if (session.user.rol !== "DEVELOPER") {
    redirect("/dashboard");
  }

  return <DeveloperPerfilForm userId={session.user.id} />;
}
