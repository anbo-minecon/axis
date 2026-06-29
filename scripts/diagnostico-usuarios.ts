import { db } from "@/lib/db";

async function main() {
  const usuarios = await db.usuario.findMany({
    where: { nombre: { contains: "Juan" } },
    select: { id: true, nombre: true, email: true, rol: true, suscripcion: { select: { activa: true } } },
  });
  console.log(`Usuarios encontrados: ${usuarios.length}`);
  console.log(JSON.stringify(usuarios, null, 2));
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});