import type { Metadata } from "next";
import ToastContainer from "@/components/shared/ToastContainer";

export const metadata: Metadata = {
  title: "Autenticación | AXIS Pre-ICFES",
  description: "Inicia sesión o crea una cuenta en AXIS Pre-ICFES",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
