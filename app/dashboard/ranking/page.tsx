// app/dashboard/ranking/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RankingClient } from "@/components/dashboard/RankingClient";

export const metadata = { title: "Ranking | AXIS Pre-ICFES" };

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { grupoId: true },
  });

  return (
    <RankingClient
      userId={session.user.id}
      tieneGrupo={!!usuario?.grupoId}
    />
  );
}