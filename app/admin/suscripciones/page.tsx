// app/admin/suscripciones/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SuscripcionesClient } from "./SuscripcionesClient";

export default async function SuscripcionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const now = new Date();

  /* Obtener todos los estudiantes con su suscripción */
  const estudiantes = await db.usuario.findMany({
    where: { rol: "ESTUDIANTE" },
    include: {
      suscripcion: {
        include: {
          plan: { select: { id: true, nombre: true, precio: true, duracionDias: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  /* Transformar a formato compatible */
  const suscripciones = estudiantes.map((u) => ({
    id: u.suscripcion?.id ?? `temp-${u.id}`,
    usuarioId: u.id,
    planId: u.suscripcion?.planId ?? null,
    fechaInicio: u.suscripcion?.fechaInicio ? new Date(u.suscripcion.fechaInicio).toISOString() : null,
    fechaFin: u.suscripcion?.fechaFin ? new Date(u.suscripcion.fechaFin).toISOString() : null,
    activa: u.suscripcion?.activa ?? false,
    usuario: { id: u.id, nombre: u.nombre, email: u.email, documento: u.documento, imagen: u.imagen },
    plan: u.suscripcion?.plan ?? null,
    tieneSuscripcion: !!u.suscripcion,
  }));

  const planes = await db.plan.findMany({ 
    where: { activo: true }, 
    select: { id: true, nombre: true, precio: true, duracionDias: true } 
  });

  const [totalEstudiantes, totalSinSuscripcion, totalConSuscripcion, totalActivas, totalExpiradas] = await Promise.all([
    db.usuario.count({ where: { rol: "ESTUDIANTE" } }),
    // Sin suscripción: sin relación O desactivadas
    db.usuario.count({
      where: {
        rol: "ESTUDIANTE",
        OR: [
          { suscripcion: null },
          { suscripcion: { activa: false } }
        ]
      }
    }),
    // Con suscripción: relación existe Y activa
    db.usuario.count({
      where: {
        rol: "ESTUDIANTE",
        suscripcion: { activa: true }
      }
    }),
    // Activas: dentro de vigencia
    db.suscripcion.count({ where: { activa: true, fechaFin: { gte: now } } }),
    // Expiradas: fecha pasada
    db.suscripcion.count({ where: { activa: true, fechaFin: { lt: now } } }),
  ]);

  return (
    <SuscripcionesClient
      initialData={suscripciones as any}
      planes={planes}
      contadores={{
        todas: totalEstudiantes,
        sinSuscripcion: totalSinSuscripcion,
        conSuscripcion: totalConSuscripcion,
        activas: totalActivas,
        expiradas: totalExpiradas,
      }}
    />
  );
}