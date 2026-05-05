// app/dashboard/resultados/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResultadoDetalleClient } from "@/components/dashboard/ResultadoDetalleClient";

export const metadata = { title: "Detalle del Resultado | AXIS Pre-ICFES" };

export default async function ResultadoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  return <ResultadoDetalleClient examenId={params.id} />;
}