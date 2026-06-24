-- AlterTable
ALTER TABLE "claves_examen" ADD COLUMN     "area" TEXT;

-- AlterTable
ALTER TABLE "resultados_simulacro" ADD COLUMN     "percentil" DOUBLE PRECISION,
ADD COLUMN     "puntajePorArea" JSONB,
ADD COLUMN     "ranking" INTEGER;
