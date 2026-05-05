// app/dashboard/simulacros/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SimulacrosListClient } from "@/components/dashboard/SimulacrosListClient";
import { SuscripcionInactiva } from "@/components/dashboard/SuscripcionInactiva";

export const metadata = { title: "Simulacros | AXIS Pre-ICFES" };

export const dynamic = "force-dynamic";

export default async function SimulacrosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      suscripcion: { select: { activa: true } },
    },
  });

  if (!usuario) redirect("/auth/login");

  const tieneSubscripcionActiva = usuario.suscripcion?.activa ?? false;

  return tieneSubscripcionActiva ? (
    <SimulacrosListClient />
  ) : (
    <SuscripcionInactiva />
  );
}