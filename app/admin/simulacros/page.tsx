// app/admin/simulacros/page.tsx
import { SimulacrosClient } from "@/components/admin/SimulacrosClient";

export const metadata = {
  title: "Simulacros | AXIS Admin",
};

export default function SimulacrosPage() {
  return <SimulacrosClient />;
}