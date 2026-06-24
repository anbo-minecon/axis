-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "grupoId" TEXT,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "telefono" TEXT;

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "departamento" TEXT,
    "municipio" TEXT,
    "docenteId" TEXT,
    "horario" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
