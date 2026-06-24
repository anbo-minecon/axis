-- CreateTable
CREATE TABLE "resultados_simulacro" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "respuestas" JSONB NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "tiempoUsado" INTEGER NOT NULL,
    "completadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultados_simulacro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resultados_simulacro_estudianteId_examenId_key" ON "resultados_simulacro"("estudianteId", "examenId");

-- AddForeignKey
ALTER TABLE "resultados_simulacro" ADD CONSTRAINT "resultados_simulacro_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_simulacro" ADD CONSTRAINT "resultados_simulacro_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
