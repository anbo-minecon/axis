// app/dashboard/resultados/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ResultadosListClient } from "@/components/dashboard/ResultadosListClient";
import { SuscripcionInactiva } from "@/components/dashboard/SuscripcionInactiva";

export const metadata = { title: "Resultados | AXIS Pre-ICFES" };
export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { suscripcion: { select: { activa: true } } },
  });

  if (!usuario?.suscripcion?.activa) return <SuscripcionInactiva />;

  return <ResultadosListClient />;
}