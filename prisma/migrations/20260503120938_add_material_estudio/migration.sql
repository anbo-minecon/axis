-- CreateEnum
CREATE TYPE "TipoMaterial" AS ENUM ('PDF', 'VIDEO');

-- CreateTable
CREATE TABLE "materiales" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoMaterial" NOT NULL,
    "url" TEXT NOT NULL,
    "materia" TEXT,
    "gratis" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);
