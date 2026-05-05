// app/dashboard/material/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MaterialClient } from "@/components/dashboard/MaterialClient";

export const metadata = { title: "Material de Estudio | AXIS Pre-ICFES" };

export default async function MaterialPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  return <MaterialClient />;
}