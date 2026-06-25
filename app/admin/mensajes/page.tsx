// app/admin/mensajes/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminMensajesClient } from "@/components/admin/AdminMensajesClient";

export const metadata = { title: "Mensajes | AXIS Admin" };
export const dynamic = "force-dynamic";

export default async function AdminMensajesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  return <AdminMensajesClient userId={session.user.id} />;
}