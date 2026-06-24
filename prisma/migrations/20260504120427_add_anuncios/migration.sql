-- CreateTable
CREATE TABLE "anuncios" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id")
);
