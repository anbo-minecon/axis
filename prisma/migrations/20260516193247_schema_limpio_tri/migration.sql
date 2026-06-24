/*
  Warnings:

  - The values [CERRADO] on the enum `EstadoExamen` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cambios` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `activo` on the `developer_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `direccionIP` on the `developer_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `tokenSecret` on the `developer_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `ultimoAcceso` on the `developer_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `fechaResultados` on the `examenes_template` table. All the data in the column will be lost.
  - You are about to drop the column `sesiones` on the `examenes_template` table. All the data in the column will be lost.
  - You are about to drop the column `aciertos` on the `resultados_sesion` table. All the data in the column will be lost.
  - You are about to alter the column `puntajePreliminar` on the `resultados_sesion` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `puntajePreliminar` on the `resultados_simulacro` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[examenId,numeroPregunta,sesionId]` on the table `claves_examen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examenId,numeroPregunta,sesionId]` on the table `pesos_pregunta` will be added. If there are existing duplicate values, this will fail.
  - Made the column `usuarioId` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `correctas` to the `resultados_sesion` table without a default value. This is not possible if the table is not empty.
  - Made the column `respuestas` on table `resultados_simulacro` required. This step will fail if there are existing NULL values in that column.
  - Made the column `puntaje` on table `resultados_simulacro` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total` on table `resultados_simulacro` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoExamen_new" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');
ALTER TABLE "examenes_template" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "examenes_template" ALTER COLUMN "estado" TYPE "EstadoExamen_new" USING ("estado"::text::"EstadoExamen_new");
ALTER TYPE "EstadoExamen" RENAME TO "EstadoExamen_old";
ALTER TYPE "EstadoExamen_new" RENAME TO "EstadoExamen";
DROP TYPE "EstadoExamen_old";
ALTER TABLE "examenes_template" ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "claves_examen" DROP CONSTRAINT "claves_examen_sesionId_fkey";

-- DropIndex
DROP INDEX "claves_examen_examenId_sesionId_numeroPregunta_key";

-- DropIndex
DROP INDEX "developer_credentials_tokenSecret_key";

-- DropIndex
DROP INDEX "pesos_pregunta_examenId_sesionId_numeroPregunta_key";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "cambios",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "ip" TEXT,
ALTER COLUMN "usuarioId" SET NOT NULL,
ALTER COLUMN "recurso" DROP NOT NULL;

-- AlterTable
ALTER TABLE "developer_credentials" DROP COLUMN "activo",
DROP COLUMN "direccionIP",
DROP COLUMN "tokenSecret",
DROP COLUMN "ultimoAcceso";

-- AlterTable
ALTER TABLE "examenes_template" DROP COLUMN "fechaResultados",
DROP COLUMN "sesiones",
ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ADD COLUMN     "fechaDisponible" TIMESTAMP(3),
ADD COLUMN     "tieneSesiones" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triCalculado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "resultados_sesion" DROP COLUMN "aciertos",
ADD COLUMN     "correctas" INTEGER NOT NULL,
ADD COLUMN     "tiempoUsado" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "resultados_simulacro" ALTER COLUMN "respuestas" SET NOT NULL,
ALTER COLUMN "respuestas" SET DEFAULT '{}',
ALTER COLUMN "puntaje" SET NOT NULL,
ALTER COLUMN "puntaje" SET DEFAULT 0,
ALTER COLUMN "total" SET NOT NULL,
ALTER COLUMN "total" SET DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DEFAULT 0,
ALTER COLUMN "puntajePreliminar" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "sesiones_examen" ALTER COLUMN "tiempoMin" SET DEFAULT 60;

-- CreateIndex
CREATE UNIQUE INDEX "claves_examen_examenId_numeroPregunta_sesionId_key" ON "claves_examen"("examenId", "numeroPregunta", "sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "pesos_pregunta_examenId_numeroPregunta_sesionId_key" ON "pesos_pregunta"("examenId", "numeroPregunta", "sesionId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claves_examen" ADD CONSTRAINT "claves_examen_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_examen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
