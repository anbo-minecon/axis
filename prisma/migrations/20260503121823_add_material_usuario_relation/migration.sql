-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
