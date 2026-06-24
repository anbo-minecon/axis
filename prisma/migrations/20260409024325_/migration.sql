-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'DOCENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoSimulacro" AS ENUM ('COMPLETO', 'POR_AREA', 'PRACTICA_RAPIDA');

-- CreateEnum
CREATE TYPE "EstadoSimulacro" AS ENUM ('EN_PROGRESO', 'FINALIZADO', 'ABANDONADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "imagen" TEXT,
    "colegio" TEXT,
    "grado" INTEGER,
    "ciudad" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "icono" TEXT,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "nivelDificultad" INTEGER NOT NULL DEFAULT 1,
    "anioReferencia" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_respuesta" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "preguntaId" TEXT NOT NULL,

    CONSTRAINT "opciones_respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulacros" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoSimulacro" NOT NULL DEFAULT 'COMPLETO',
    "estado" "EstadoSimulacro" NOT NULL DEFAULT 'EN_PROGRESO',
    "puntajeTotal" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "duracionMin" INTEGER NOT NULL DEFAULT 210,

    CONSTRAINT "simulacros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_usuario" (
    "id" TEXT NOT NULL,
    "simulacroId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "opcionSeleccionadaId" TEXT,
    "esCorrecta" BOOLEAN,
    "tiempoSegundos" INTEGER,
    "respondidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "duracionDias" INTEGER NOT NULL,
    "simulacrosMax" INTEGER NOT NULL DEFAULT -1,
    "caracteristicas" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "planes_nombre_key" ON "planes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_usuarioId_key" ON "suscripciones"("usuarioId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_respuesta" ADD CONSTRAINT "opciones_respuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulacros" ADD CONSTRAINT "simulacros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_usuario" ADD CONSTRAINT "respuestas_usuario_simulacroId_fkey" FOREIGN KEY ("simulacroId") REFERENCES "simulacros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_usuario" ADD CONSTRAINT "respuestas_usuario_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_usuario" ADD CONSTRAINT "respuestas_usuario_opcionSeleccionadaId_fkey" FOREIGN KEY ("opcionSeleccionadaId") REFERENCES "opciones_respuesta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
