// ══════════════════════════════════════════════════════
// ARCHIVO 1: app/dashboard/mensajes/page.tsx
// ══════════════════════════════════════════════════════
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MensajesClient } from "@/components/dashboard/MensajesClient";

export const metadata = { title: "Mensajes | AXIS Pre-ICFES" };
export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  return <MensajesClient userId={session.user.id} />;
}