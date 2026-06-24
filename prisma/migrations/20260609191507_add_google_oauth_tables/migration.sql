-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_usuarioId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
