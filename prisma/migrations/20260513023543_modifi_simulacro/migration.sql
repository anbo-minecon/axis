/*
  Warnings:

  - A unique constraint covering the columns `[examenId,sesionId,numeroPregunta]` on the table `claves_examen` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoCalificacion" AS ENUM ('PRELIMINAR', 'OFICIAL');

-- AlterEnum
ALTER TYPE "EstadoExamen" ADD VALUE 'CERRADO';

-- DropIndex
DROP INDEX "claves_examen_examenId_numeroPregunta_key";

-- AlterTable
ALTER TABLE "claves_examen" ADD COLUMN     "sesionId" TEXT;

-- AlterTable
ALTER TABLE "examenes_template" ADD COLUMN     "fechaResultados" TIMESTAMP(3),
ADD COLUMN     "sesiones" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "resultados_simulacro" ADD COLUMN     "estadoCalif" "EstadoCalificacion" NOT NULL DEFAULT 'PRELIMINAR',
ADD COLUMN     "puntajePreliminar" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "puntajeTRI" DOUBLE PRECISION,
ALTER COLUMN "respuestas" DROP NOT NULL,
ALTER COLUMN "puntaje" DROP NOT NULL,
ALTER COLUMN "total" DROP NOT NULL,
ALTER COLUMN "tiempoUsado" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "sesiones_examen" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tiempoMin" INTEGER NOT NULL,

    CONSTRAINT "sesiones_examen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_sesion" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "respuestas" JSONB NOT NULL,
    "aciertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "puntajePreliminar" DOUBLE PRECISION NOT NULL,
    "puntajeTRI" DOUBLE PRECISION,
    "completadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultados_sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesos_pregunta" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "sesionId" TEXT,
    "numeroPregunta" INTEGER NOT NULL,
    "dificultad" DOUBLE PRECISION NOT NULL,
    "discriminacion" DOUBLE PRECISION NOT NULL,
    "pesoNormalizado" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pesos_pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_examen_examenId_numero_key" ON "sesiones_examen"("examenId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_sesion_estudianteId_sesionId_key" ON "resultados_sesion"("estudianteId", "sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "pesos_pregunta_examenId_sesionId_numeroPregunta_key" ON "pesos_pregunta"("examenId", "sesionId", "numeroPregunta");

-- CreateIndex
CREATE UNIQUE INDEX "claves_examen_examenId_sesionId_numeroPregunta_key" ON "claves_examen"("examenId", "sesionId", "numeroPregunta");

-- AddForeignKey
ALTER TABLE "claves_examen" ADD CONSTRAINT "claves_examen_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_examen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_examen" ADD CONSTRAINT "sesiones_examen_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_sesion" ADD CONSTRAINT "resultados_sesion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_sesion" ADD CONSTRAINT "resultados_sesion_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_sesion" ADD CONSTRAINT "resultados_sesion_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_examen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesos_pregunta" ADD CONSTRAINT "pesos_pregunta_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesos_pregunta" ADD CONSTRAINT "pesos_pregunta_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_examen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
