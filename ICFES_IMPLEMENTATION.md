# 🎯 Implementación Motor ICFES - AXIS-PREICFES

**Objetivo General**: Migrar del sistema TRI simple (0-100, sin áreas) al modelo ICFES completo (0-500, 5 áreas de conocimiento, ranking, percentil).

**Fecha Inicio**: Junio 23, 2026  
**Última Actualización**: Junio 24, 2026

---

## 📊 Estado Actual

```
FASE 1 ✅ COMPLETADA
FASE 2 ⏳ EN PLAN
FASE 3 ⏳ EN PLAN
FASE 4 ⏳ EN PLAN
FASE 5 ⏳ EN PLAN
```

---

## 🏗️ FASE 1: Infraestructura Backend + Motor Matemático ✅ COMPLETADA

**Duración**: ~20 minutos | **Status**: ✅ COMPLETADA | **Compilación**: ✅ 0 errores

### ¿Qué se hizo?

#### 1. Schema Prisma - Nuevos Campos
```prisma
// ClaveExamen
area  String?  // LECTURA CRITICA, MATEMATICAS, etc.

// ResultadoSimulacro
puntajePorArea  Json?      // {"LECTURA CRITICA": 120, ...}
ranking         Int?       // Posición en grupo
percentil       Float?     // 0-100
```

**Archivo**: [prisma/schema.prisma](prisma/schema.prisma)  
**Migración**: `20260624014735_add_icfes_area_and_scores`

#### 2. Factor Curva: 1.5 → 1.7
Cambio en 3 funciones:
- `calcularPuntajeTRI()`
- `calcularPuntajePreliminar()`
- `calcularTRIGrupo()`

**Archivo**: [lib/tri-engine.ts](lib/tri-engine.ts)

#### 3. Motor ICFES - 3 Nuevas Funciones

```typescript
// Calcula pesos separados por área
calcularPesosPorArea(respuestasGrupo, claves, umbralExclusion)

// Puntaje TRI para un área específica
calcularPuntajeTRIArea(respuestasEstudiante, pesosArea, clavesArea, factorCurva)

// Orquesta todo: calcula todas las áreas para todos los estudiantes
calcularTRIGrupoPorArea(respuestasGrupo, clavesConArea, factorCurva)
```

**Archivo**: [lib/tri-engine.ts](lib/tri-engine.ts#L190-L330)

#### 4. Tipos TypeScript - ICFES

```typescript
// 5 áreas definidas
export const ICFES_AREAS = [
  "LECTURA CRITICA",
  "MATEMATICAS",
  "CIENCIAS NATURALES",
  "SOCIALES Y CIUDADANAS",
  "INGLES",
]

// Interface de puntajes por área
export interface ScoreAreas {
  "LECTURA CRITICA": number;
  "MATEMATICAS": number;
  "CIENCIAS NATURALES": number;
  "SOCIALES Y CIUDADANAS": number;
  "INGLES": number;
}
```

**Archivo**: [types/icfes.ts](types/icfes.ts) **(NEW FILE)**

#### 5. Admin Routes - Soporte `area`

```typescript
const claveSchema = z.object({
  numero:     z.number().int().positive(),
  respuesta:  z.enum(["A", "B", "C", "D"]).nullable(),
  sesion:     z.number().int().positive().default(1),
  dificultad: z.enum(["facil", "media", "dificil"]).default("media"),
  area:       z.enum(["LECTURA CRITICA", "MATEMATICAS", ...]).optional(),  // ← NEW
});
```

**Archivo**: [app/api/admin/simulacros/route.ts](app/api/admin/simulacros/route.ts#L28-L39)

#### 6. Cron TRI - Cálculos por Área

El cron job ahora:
1. Calcula `puntajePorArea` para cada estudiante
2. Con sesiones: consolida con promedio ponderado
3. Guarda JSON en `resultadoSimulacro.puntajePorArea`
4. Sigue siendo backward-compatible

**Archivo**: [app/api/cron/calcular-tri/route.ts](app/api/cron/calcular-tri/route.ts#L128-L370)

### ✅ Validación
- `npx prisma migrate dev` → **Exitosa**
- `npx tsc --noEmit` → **0 errores**
- Código **backward-compatible** (area es opcional)

---

## 🎨 FASE 2: Template Import + Admin UI

**Estimado**: 15-20 minutos | **Status**: ⏳ NO INICIADA

### Tareas

1. **Update Import Template** (`components/admin/SimulacrosClient.tsx`)
   - Agregar columna 6: `area`
   - Formato CSV: `simulacro,materia,pregunta,respuesta_correcta,sesion,dificultad,area`
   - Ejemplos: "LECTURA CRITICA", "MATEMATICAS", etc.

2. **Update Import Logic** (`app/api/admin/simulacros/importar/route.ts`)
   - Parsear columna `area` del CSV
   - Validar que sea una de 5 áreas válidas
   - Asignar `area` a cada `ClaveExamen` al insertar

3. **Download Template Update**
   - Generar CSV con 7 columnas (agregar `area`)
   - Mostrar ejemplos de áreas

**Archivos a Tocar**:
- [components/admin/SimulacrosClient.tsx](components/admin/SimulacrosClient.tsx)
- [app/api/admin/simulacros/importar/route.ts](app/api/admin/simulacros/importar/route.ts)

---

## 📊 FASE 3: UI/Dashboard Updates

**Estimado**: 40-60 minutos | **Status**: ⏳ NO INICIADA

### Tareas

1. **Velocímetro Gauge** → Cambio de escala
   - **De**: 0-100 (verde, amarillo, rojo)
   - **A**: 0-500 con 3 zonas:
     - 0-250: Rojo (malo)
     - 250-350: Naranja (medio)
     - 350-500: Verde (bueno)

2. **Gráfico Radar** → 5 áreas ICFES
   - Mostrar puntaje de cada área (0-100)
   - Comparar vs grupo (promedio)
   - Escala radial clara

3. **Stats Cards**
   - Ranking: "Posición 45 de 200"
   - Percentil: "Mejor que el 78% del grupo"
   - Por área: "MATEMATICAS: 95 (top 15%)"

4. **Layout Dashboard**
   - Velocímetro (grande, arriba)
   - Radar de áreas (derecha)
   - Stats cards (abajo)
   - Aciertos crudos (pequeño, pie)

**Archivos a Tocar**:
- [app/dashboard/resultados/page.tsx](app/dashboard/resultados/page.tsx)
- [components/dashboard/ResultadosClient.tsx](components/dashboard/ResultadosClient.tsx) (si existe)

---

## 🏆 FASE 4: Ranking + Percentil

**Estimado**: 20-30 minutos | **Status**: ⏳ NO INICIADA

### Tareas

1. **Función: Calcular Ranking**
   ```typescript
   // después de que TRI es oficial, calcular posición
   calcularRanking(examenId: string): Promise<void>
   ```
   - Ordena todos los ResultadoSimulacro por `puntajeTRI DESC`
   - Asigna `ranking` = posición (1 = mejor)

2. **Función: Calcular Percentil**
   ```typescript
   // percentil = (n_menores / n_total) * 100
   calcularPercentil(examenId: string): Promise<void>
   ```
   - Calcula: `(cantidad_estudiantes_con_puntaje_menor / total) * 100`

3. **Integrar en Cron**
   - Después de consolidar TRI, ejecutar:
     1. `calcularRanking(examenId)`
     2. `calcularPercentil(examenId)`

4. **Función Auxiliar: Stats del Grupo**
   ```typescript
   calcularEstadisticasGrupo(examenId: string): GroupScoreStatistics
   // Retorna: promedio, desviación, mín, máx, mediana, Q1, Q3
   ```

**Archivos a Crear/Modificar**:
- [lib/ranking-utils.ts](lib/ranking-utils.ts) **(NEW FILE)**
- [app/api/cron/calcular-tri/route.ts](app/api/cron/calcular-tri/route.ts) (agregar llamadas)

---

## ⏰ FASE 5: Decisión Puntajes Diferidos

**Status**: ⏳ PENDIENTE CONFIRMACIÓN DEL CLIENTE

### Opciones

**Opción A** (Recomendada):
```
Estudiante envía → Ve puntaje PRELIMINAR inmediato (sin TRI)
Admin cierra exam → Sistema calcula TRI oficial
Estudiante ve → Puntaje OFICIAL actualizado
```
- **Ventaja**: Feedback inmediato al estudiante
- **Implementación**: Ya está parcialmente hecha (calcularPuntajePreliminar)

**Opción B** (Literal cliente):
```
Estudiante envía → No ve NADA (pending)
Admin cierra exam → Sistema calcula TRI
Estudiante ve → Puntaje OFICIAL
```
- **Ventaja**: Estricto/justo
- **Desventaja**: Sin feedback hasta que admin cierre

### Implementación (cuando confirme)
1. Agregar campo `estadoVista` a `ResultadoSimulacro` (PRELIMINAR, OFICIAL)
2. API `/api/resultados/:examenId` filtra por estadoVista
3. UI muestra badge "En revisión" si Opción B

---

## 📁 Estructura de Archivos Clave

```
lib/
  ├─ tri-engine.ts ✅ ACTUALIZADO
  │  └─ +3 funciones para áreas
  │  └─ Factor 1.7
  ├─ ranking-utils.ts ⏳ TODO (FASE 4)
  └─ icfes-utils.ts ⏳ TODO (si necesario)

types/
  ├─ icfes.ts ✅ NUEVO

prisma/
  ├─ schema.prisma ✅ ACTUALIZADO
  └─ migrations/
     └─ 20260624014735_add_icfes_area_and_scores ✅ APLICADA

app/api/
  ├─ admin/simulacros/
  │  ├─ route.ts ✅ ACTUALIZADO (area en schema)
  │  └─ importar/route.ts ⏳ TODO (FASE 2)
  ├─ cron/calcular-tri/
  │  └─ route.ts ✅ ACTUALIZADO (calcula puntajePorArea)
  └─ resultados/ ⏳ TODO (FASE 5 - si necesario)

components/admin/
  └─ SimulacrosClient.tsx ⏳ TODO (FASE 2 - template)

app/dashboard/
  └─ resultados/page.tsx ⏳ TODO (FASE 3 - UI)
```

---

## 🔧 Cómo Continuar

### Si se acaban los tokens:

1. **Leer este archivo** para recordar estado
2. **Revisar FASE X** que necesita trabajarse
3. **Revisar archivos sugeridos** en esa fase
4. **Ejecutar**: `npx tsc --noEmit` para validar

### Comandos Útiles

```bash
# Validar compilación
npx tsc --noEmit

# Ver migraciones aplicadas
npx prisma migrate status

# Revisar BD
npx prisma studio

# Test del cron manualmente
curl -X POST http://localhost:3000/api/cron/calcular-tri \
  -H "x-admin-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"examenId":"abc123"}'
```

---

## 📝 Notas Técnicas

### Backward Compatible ✅
- Campo `area` es **opcional** en todas partes
- Claves sin `area` funcionan normalmente
- Cálculos sin área = cálculos de sesión normales

### Escalas
- **Por Área**: 0-100 (escala interna de cálculo)
- **Global**: 0-500 (escala ICFES) ← **Convertir en FASE 3 UI**
- Fórmula: `puntaje_0_100 * 5 = puntaje_0_500`

### 2 Sesiones Preservadas
- Arquitectura NO cambió
- Cada sesión puede tener preguntas de 5 áreas
- Consolidación: promedio ponderado por sesión ✅

### Interfaz Interfaces Principales
```typescript
// Desde types/icfes.ts
interface ScoreAreas { ... }        // 5 áreas
interface StudentScoreReport { ... } // Reporte estudiante
interface ExamAreaReport { ... }     // Reporte por área
```

---

## 👤 Roles + Permisos

- **ADMIN**: Crear/editar simulacros, ver todas las estadísticas
- **ESTUDIANTE**: Ver sus resultados, áreas débiles, ranking
- **DOCENTE**: Ver resultados del grupo, estadísticas agregadas
- **DEVELOPER**: Auditoría completa (logs, integraciones)

---

## 🎯 Checklist Final (Todas las Fases)

- [ ] FASE 1 ✅ Backend + Motor
- [ ] FASE 2 ⏳ Import template + Admin
- [ ] FASE 3 ⏳ UI dashboard
- [ ] FASE 4 ⏳ Ranking/percentil
- [ ] FASE 5 ⏳ Decisión puntajes diferidos
- [ ] Compilación TypeScript 0 errores
- [ ] Prisma migrations aplicadas
- [ ] Pruebas end-to-end en dev
- [ ] Documentación para cliente

---

**Próximo Paso**: Esperar instrucción o continuar con **FASE 2** 🚀
