-- AlterTable
ALTER TABLE "developer_credentials" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "direccionIP" TEXT,
ADD COLUMN     "tokenSecret" TEXT,
ADD COLUMN     "ultimoAcceso" TIMESTAMP(3);
