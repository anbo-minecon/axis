# INSTRUCCIONES DE MIGRACIÓN — Aplicar cambios del schema.prisma

## Cambios realizados en schema.prisma

### 1. Enum EstadoExamen — agregado CERRADO
```prisma
# ANTES:
enum EstadoExamen {
  BORRADOR
  PUBLICADO
  ARCHIVADO
}

# DESPUÉS:
enum EstadoExamen {
  BORRADOR
  PUBLICADO
  CERRADO     ← NUEVO
  ARCHIVADO
}
```

### 2. ResultadoSesion — campo renombrado de correctas → aciertos
```prisma
# ANTES:
correctas Int

# DESPUÉS:
aciertos Int @default(0)
```

### 3. ResultadoSimulacro — puntajePreliminar cambiado de Int a Float
```prisma
# ANTES:
puntajePreliminar Int @default(0)

# DESPUÉS:
puntajePreliminar Float @default(0)
```

---

## Pasos para aplicar

### Opción A — Desarrollo local (recomendada)
```bash
# 1. Reemplazar prisma/schema.prisma con el archivo entregado
# 2. Crear migración
npx prisma migrate dev --name "add_estado_cerrado_fix_aciertos"

# 3. Regenerar cliente Prisma
npx prisma generate
```

### Opción B — Producción (Vercel + Supabase/Neon/Railway)
```bash
# 1. Reemplazar prisma/schema.prisma
# 2. Crear migración en local primero
npx prisma migrate dev --name "add_estado_cerrado_fix_aciertos"

# 3. Aplicar en producción
npx prisma migrate deploy

# 4. Regenerar cliente
npx prisma generate
```

### Opción C — Si no puedes hacer migrate (BD de terceros sin acceso directo)
Ejecutar este SQL directamente en la consola de tu BD:

```sql
-- 1. Agregar CERRADO al enum EstadoExamen
ALTER TYPE "EstadoExamen" ADD VALUE IF NOT EXISTS 'CERRADO';

-- 2. Renombrar columna correctas → aciertos en resultados_sesion
-- (solo si la columna se llama "correctas" en tu BD actual)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resultados_sesion' AND column_name = 'correctas'
  ) THEN
    ALTER TABLE "resultados_sesion" RENAME COLUMN "correctas" TO "aciertos";
  END IF;
END $$;

-- Agregar default si no existe
ALTER TABLE "resultados_sesion" ALTER COLUMN "aciertos" SET DEFAULT 0;

-- 3. Cambiar puntajePreliminar de Int a Float en resultados_simulacro (si aplica)
ALTER TABLE "resultados_simulacro"
  ALTER COLUMN "puntajePreliminar" TYPE DOUBLE PRECISION USING "puntajePreliminar"::DOUBLE PRECISION;

ALTER TABLE "resultados_sesion"
  ALTER COLUMN "puntajePreliminar" TYPE DOUBLE PRECISION USING "puntajePreliminar"::DOUBLE PRECISION;
```

---

## Archivos a reemplazar después de la migración

| Archivo entregado | Ruta en el proyecto |
|---|---|
| `schema.prisma` | `prisma/schema.prisma` |
| `route_id_corregido.ts` | `app/api/admin/simulacros/[id]/route.ts` |
| `route_cron_calcular_tri.ts` | `app/api/cron/calcular-tri/route.ts` |
| `route_sesion_enviar.ts` | `app/api/dashboard/simulacros/[id]/sesion/[num]/enviar/route.ts` |

---

## Resumen de bugs corregidos

| # | Archivo | Bug | Fix |
|---|---|---|---|
| 1 | `schema.prisma` | `CERRADO` no existía en enum `EstadoExamen` → PATCH fallaba silenciosamente | Agregado `CERRADO` al enum |
| 2 | `schema.prisma` | Campo `correctas` en schema vs `aciertos` en código → TRI leía null | Renombrado a `aciertos` en todo |
| 3 | `cron/calcular-tri` | Usaba `pesoPregunta` (sin 's') → modelo no existe en Prisma | Corregido a `pesosPregunta` |
| 4 | `cron/calcular-tri` | Solo cerraba automáticamente si estado=PUBLICADO; CERRADO manual no ejecutaba TRI | Cron ahora busca en `["PUBLICADO","CERRADO"]` |
| 5 | `sesion/[num]/enviar` | Limitaba numSesion a máx 2 → sesiones 3+ fallaban | Removido límite, acepta cualquier número positivo |