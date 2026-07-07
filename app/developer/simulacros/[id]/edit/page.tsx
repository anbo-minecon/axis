// app/developer/simulacros/[id]/edit/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeveloperSimulacroEdit } from "@/components/developer/DeveloperSimulacroEdit";

export const dynamic = "force-dynamic";

export default function DeveloperSimulacroEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("developer_token");
    if (!token) {
      router.replace("/developer/login");
    }
  }, [router]);

  return <DeveloperSimulacroEdit simulacroId={params.id} />;
}
