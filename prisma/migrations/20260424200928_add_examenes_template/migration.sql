-- CreateEnum
CREATE TYPE "EstadoExamen" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "examenes_template" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "totalPreguntas" INTEGER NOT NULL DEFAULT 50,
    "tiempoMin" INTEGER NOT NULL DEFAULT 120,
    "estado" "EstadoExamen" NOT NULL DEFAULT 'BORRADOR',
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examenes_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claves_examen" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "numeroPregunta" INTEGER NOT NULL,
    "respuesta" TEXT NOT NULL,

    CONSTRAINT "claves_examen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claves_examen_examenId_numeroPregunta_key" ON "claves_examen"("examenId", "numeroPregunta");

-- AddForeignKey
ALTER TABLE "claves_examen" ADD CONSTRAINT "claves_examen_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
