import { db } from "@/lib/db";

async function main() {
  const usuarios = await db.usuario.findMany({
    where: { rol: "ESTUDIANTE" },
    select: {
      id: true,
      nombre: true,
      email: true,
      suscripcion: { select: { activa: true } },
      resultados: { select: { id: true, estadoCalif: true, examenId: true } },
    },
  });
  console.log(`Usuarios estudiantes: ${usuarios.length}`);
  for (const u of usuarios) {
    console.log(`- id=${u.id} nombre=${u.nombre} email=${u.email} subs=${u.suscripcion?.activa}`);
    console.log(`  resultados: ${u.resultados.length}`);
    for (const r of u.resultados) {
      console.log(`    - ${r.id} examenId=${r.examenId} estadoCalif=${r.estadoCalif}`);
    }
  }
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});