/*
  Warnings:

  - You are about to drop the column `correctas` on the `resultados_sesion` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "EstadoExamen" ADD VALUE 'CERRADO';

-- AlterTable
ALTER TABLE "resultados_sesion" DROP COLUMN "correctas",
ADD COLUMN     "aciertos" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "resultados_simulacro" ALTER COLUMN "puntajePreliminar" SET DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DATA TYPE DOUBLE PRECISION;
