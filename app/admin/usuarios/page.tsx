// app/admin/usuarios/page.tsx
import { UsuariosClient } from "@/components/admin/UsuariosClient";

export const metadata = {
  title: "Gestionar Usuarios | AXIS Admin",
};

export default function UsuariosPage() {
  return <UsuariosClient />;
}