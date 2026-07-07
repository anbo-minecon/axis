-- AlterTable
ALTER TABLE "resultados_sesion" ADD COLUMN     "esBorrador" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "resultados_simulacro" ADD COLUMN     "esBorrador" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "protegerDocumento" BOOLEAN NOT NULL DEFAULT true;
