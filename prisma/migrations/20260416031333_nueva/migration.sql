-- AlterTable
ALTER TABLE "simulacros" ADD COLUMN     "totalPreguntas" INTEGER NOT NULL DEFAULT 45;

-- CreateTable
CREATE TABLE "intentos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "simulacroId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "puntaje" DOUBLE PRECISION,
    "aciertos" INTEGER,
    "totalPreguntas" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "duracionMin" INTEGER,

    CONSTRAINT "intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_intento" (
    "id" TEXT NOT NULL,
    "intentoId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "opcionId" TEXT,
    "esCorrecta" BOOLEAN,
    "tiempoSegundos" INTEGER,
    "respondidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_intento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intentos_usuarioId_idx" ON "intentos"("usuarioId");

-- CreateIndex
CREATE INDEX "intentos_estado_idx" ON "intentos"("estado");

-- CreateIndex
CREATE INDEX "intentos_fechaInicio_idx" ON "intentos"("fechaInicio");

-- CreateIndex
CREATE INDEX "respuestas_intento_intentoId_idx" ON "respuestas_intento"("intentoId");

-- AddForeignKey
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_simulacroId_fkey" FOREIGN KEY ("simulacroId") REFERENCES "simulacros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_intento" ADD CONSTRAINT "respuestas_intento_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "intentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
