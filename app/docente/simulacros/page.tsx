// app/docente/simulacros/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SimulacrosDocenteClient } from "@/components/docente/SimulacrosDocenteClient";

export const metadata = { title: "Gestionar Simulacros | AXIS Docente" };
export const dynamic  = "force-dynamic";

export default async function DocenteSimulacrosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const usuario = await db.usuario.findUnique({
    where:  { id: session.user.id },
    select: { rol: true },
  });
  if (usuario?.rol !== "DOCENTE") redirect("/auth/login");

  return <SimulacrosDocenteClient />;
}