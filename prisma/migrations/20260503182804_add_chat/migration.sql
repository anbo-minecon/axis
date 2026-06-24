-- CreateTable
CREATE TABLE "conversaciones" (
    "id" TEXT NOT NULL,
    "participanteAId" TEXT NOT NULL,
    "participanteBId" TEXT NOT NULL,
    "ultimoMensaje" TEXT,
    "ultimoMensajeEn" TIMESTAMP(3),
    "noLeidosA" INTEGER NOT NULL DEFAULT 0,
    "noLeidosB" INTEGER NOT NULL DEFAULT 0,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "remitenteId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversaciones_participanteAId_idx" ON "conversaciones"("participanteAId");

-- CreateIndex
CREATE INDEX "conversaciones_participanteBId_idx" ON "conversaciones"("participanteBId");

-- CreateIndex
CREATE UNIQUE INDEX "conversaciones_participanteAId_participanteBId_key" ON "conversaciones"("participanteAId", "participanteBId");

-- CreateIndex
CREATE INDEX "mensajes_conversacionId_creadoEn_idx" ON "mensajes"("conversacionId", "creadoEn");

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_participanteAId_fkey" FOREIGN KEY ("participanteAId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_participanteBId_fkey" FOREIGN KEY ("participanteBId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
