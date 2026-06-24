-- CreateEnum
CREATE TYPE "EstadoClase" AS ENUM ('ACTIVA', 'ARCHIVADA', 'ELIMINADA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CLASE', 'TAREA', 'EXAMEN', 'EVENTO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('BORRADOR', 'ASIGNADA', 'CERRADA');

-- CreateTable
CREATE TABLE "classroom_tokens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_clases" (
    "id" TEXT NOT NULL,
    "googleCourseId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "materia" TEXT,
    "seccion" TEXT,
    "enlaceAlternativo" TEXT,
    "estado" "EstadoClase" NOT NULL DEFAULT 'ACTIVA',
    "grupoId" TEXT,
    "docenteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_eventos" (
    "id" TEXT NOT NULL,
    "googleEventId" TEXT,
    "claseId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEvento" NOT NULL DEFAULT 'CLASE',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "linkMeet" TEXT,
    "linkGrabacion" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_grabaciones" (
    "id" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "linkUrl" TEXT NOT NULL,
    "materia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracionMin" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_grabaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_tareas" (
    "id" TEXT NOT NULL,
    "googleWorkId" TEXT,
    "claseId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "linkUrl" TEXT,
    "fechaEntrega" TIMESTAMP(3),
    "puntosPosibles" DOUBLE PRECISION,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'ASIGNADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_tareas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classroom_tokens_usuarioId_key" ON "classroom_tokens"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_clases_googleCourseId_key" ON "classroom_clases"("googleCourseId");

-- CreateIndex
CREATE INDEX "classroom_clases_docenteId_idx" ON "classroom_clases"("docenteId");

-- CreateIndex
CREATE INDEX "classroom_clases_grupoId_idx" ON "classroom_clases"("grupoId");

-- CreateIndex
CREATE INDEX "classroom_eventos_claseId_idx" ON "classroom_eventos"("claseId");

-- CreateIndex
CREATE INDEX "classroom_eventos_fechaInicio_idx" ON "classroom_eventos"("fechaInicio");

-- CreateIndex
CREATE INDEX "classroom_grabaciones_claseId_idx" ON "classroom_grabaciones"("claseId");

-- CreateIndex
CREATE INDEX "classroom_grabaciones_fecha_idx" ON "classroom_grabaciones"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_tareas_googleWorkId_key" ON "classroom_tareas"("googleWorkId");

-- CreateIndex
CREATE INDEX "classroom_tareas_claseId_idx" ON "classroom_tareas"("claseId");

-- CreateIndex
CREATE INDEX "classroom_tareas_fechaEntrega_idx" ON "classroom_tareas"("fechaEntrega");

-- AddForeignKey
ALTER TABLE "classroom_tokens" ADD CONSTRAINT "classroom_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_clases" ADD CONSTRAINT "classroom_clases_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_clases" ADD CONSTRAINT "classroom_clases_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_eventos" ADD CONSTRAINT "classroom_eventos_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "classroom_clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_grabaciones" ADD CONSTRAINT "classroom_grabaciones_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "classroom_clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_tareas" ADD CONSTRAINT "classroom_tareas_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "classroom_clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
