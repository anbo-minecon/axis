// app/admin/reportes/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReportesAdmin } from "@/components/admin/ReportesAdmin";

export const metadata = { title: "Reportes del Sistema | AXIS Admin" };
export const dynamic  = "force-dynamic";

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const usuario = await db.usuario.findUnique({
    where:  { id: session.user.id },
    select: { rol: true },
  });
  if (usuario?.rol !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ReportesAdmin />
    </div>
  );
}