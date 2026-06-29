import { db } from "@/lib/db";

async function main() {
  const counts = await db.resultadoSimulacro.groupBy({
    by: ["estadoCalif"],
    _count: { _all: true },
  });
  console.log(JSON.stringify(counts, null, 2));
  const total = await db.resultadoSimulacro.count();
  console.log(`Total resultados: ${total}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
