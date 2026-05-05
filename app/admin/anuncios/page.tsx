// app/admin/anuncios/page.tsx
import { AnunciosAdminClient } from "@/components/admin/AnunciosAdminClient";

export const metadata = { title: "Anuncios | AXIS Admin" };

export default function AnunciosPage() {
  return <AnunciosAdminClient />;
}