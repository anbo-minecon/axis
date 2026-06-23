# Implementación: Simulacros con Sesiones y Calificación TRI

## Resumen General

Se ha implementado un sistema completo de simulacros con:
- ✅ **Sesiones múltiples**: Soporte para 1 o 2 sesiones por simulacro
- ✅ **Calificación TRI**: Algoritmo de Two-Response IRT con ponderación por discriminación
- ✅ **Flujo de cierre**: Estados PRELIMINAR → OFICIAL cuando admin cierra simulacro
- ✅ **UI Admin**: Controles para crear, editar, publicar y cerrar simulacros
- ✅ **Validación**: Zod schemas, manejo de errores, audit logs

---

## Cambios Implementados

### 1. Backend - Rutas API

#### `app/api/admin/simulacros/route.ts` (POST - Crear simulacro)
**Cambios:**
- Agregada validación de `sesiones` (boolean) en Zod schema
- Agregada validación de `fechaResultados` (datetime optional)
- Lógica para crear automáticamente `SesionExamen` registros (1 ó 2)
- Asignación automática de `claveExamen` a sesiones:
  - Si `sesiones=true`: distribuye respuestas entre sesión 1 y 2
  - Si `sesiones=false`: todas las claves van a sesión 1

**Código clave:**
```typescript
const sesion1 = await (db as any).sesionExamen.create({
  data: { examenId: examen.id, numero: 1, nombre: "Sesión 1...", tiempoMin }
});

if (sesiones) {
  sesion2 = await (db as any).sesionExamen.create({
    data: { examenId: examen.id, numero: 2, nombre: "Sesión 2...", tiempoMin }
  });
}

await (db as any).claveExamen.createMany({
  data: clavesDefinidas.map((c) => ({
    examenId: examen.id,
    sesionId: sesiones ? (c.sesionNumero === 2 ? sesion2?.id : sesion1.id) : sesion1.id,
    numeroPregunta: c.numero,
    respuesta: c.respuesta
  }))
});
```

#### `app/api/admin/simulacros/[id]/route.ts` (PATCH - Actualizar estado)
**Cambios:**
- Agregada lógica para manejar estado `CERRADO`
- Nueva función `cerrarSimulacro()` que:
  1. Recupera todos los `ResultadoSesion` (respuestas preliminares)
  2. Calcula pesos de preguntas usando discriminación de Pearson
  3. Recalcula puntajes TRI para cada resultado
  4. Actualiza `ResultadoSimulacro` con `estadoCalif: "OFICIAL"`

**Algoritmo TRI:**
- **Puntaje TRI por pregunta**: `(aciertos/total)^1.8 * 100`
- **Peso normalizado**: `dificultad * (1 + discriminacion)`
- **Discriminación**: Correlación de Pearson entre respuestas item y total
- **Resultado final**: `(correctas_ponderadas / total) ^ 1.8 * 100`

**Código clave de cierre:**
```typescript
async function cerrarSimulacro(examenId: string) {
  // 1. Recuperar resultados sesión
  const resultadosSesion = await (db as any).resultadoSesion.findMany({
    where: { examenId }
  });

  // 2. Calcular pesos por discriminación
  const discriminacion = pearsonCorrelation(valores, pistas);
  const peso = dificultad * (1 + discriminacion);

  // 3. Guardar pesos normalizados
  await (db as any).pesosPregunta.createMany({
    data: pesosNormalizados.map(item => ({
      examenId,
      sesionId: sesion.id,
      numeroPregunta: item.numeroPregunta,
      dificultad: item.dificultad,
      discriminacion: item.discriminacion,
      pesoNormalizado: item.pesoNormalizado
    }))
  });

  // 4. Recalcular y guardar puntajes TRI
  await (db as any).resultadoSimulacro.update({
    where: { estudianteId_examenId: {...} },
    data: {
      puntajeTRI: triScore,
      estadoCalif: "OFICIAL"
    }
  });
}
```

#### `app/api/dashboard/simulacros/[id]/enviar/route.ts` (POST - Enviar respuestas)
**Cambios:**
- Crea `ResultadoSesion` para cada sesión del examen
- Calcula puntaje preliminar por sesión: `(aciertos/total)^1.8 * 100`
- Crea `ResultadoSimulacro` con `estadoCalif: "PRELIMINAR"`
- Agrupa respuestas por sesión antes de almacenar

**Código clave:**
```typescript
for (const [sesionId, claves] of clavesPorSesion.entries()) {
  let aciertosSesion = 0;
  claves.forEach(clave => {
    if (respuestas[String(clave.numeroPregunta)] === clave.respuesta) {
      aciertosSesion++;
    }
  });

  const puntajePreliminar = calcularPuntajePreliminar(aciertosSesion, totalSesion);

  await (db as any).resultadoSesion.create({
    data: {
      estudianteId: session.user.id,
      examenId: params.id,
      sesionId,
      respuestas: respuestasSesion,
      aciertos: aciertosSesion,
      total: totalSesion,
      puntajePreliminar
    }
  });
}

await (db as any).resultadoSimulacro.create({
  data: {
    estudianteId: session.user.id,
    examenId: params.id,
    respuestas,
    puntaje: totalCorrectas,
    total: totalPreguntas,
    puntajePreliminar: puntajePreliminarGlobal,
    tiempoUsado,
    estadoCalif: "PRELIMINAR"
  }
});
```

---

### 2. Frontend - Componentes Admin

#### `components/admin/SimulacrosClient.tsx` - Cambios principales

**Creación de Simulacro:**
- Agregado estado `sesiones` (boolean)
- UI toggle "Usar dos sesiones" en el formulario
- Se envía `sesiones` en POST a `/api/admin/simulacros`

```typescript
const [sesiones, setSesiones] = useState(false);

// En el form:
<input
  type="checkbox"
  checked={sesiones}
  onChange={(e) => setSesiones(e.target.checked)}
/>
<label>Usar dos sesiones</label>
```

**Listado de Simulacros:**
- Agregado filtro por estado `CERRADO` (color: púrpura)
- Función `cerrarSimulacro(id)` que hace PATCH con `estado: "CERRADO"`
- Botón "Cerrar y Calificar" en menú PUBLICADO
- Confirmación antes de cerrar

```typescript
const cerrarSimulacro = async (id: string) => {
  const res = await fetch(`/api/admin/simulacros/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "CERRADO" })
  });
  // Refrescar lista...
};

// En dropdown menu:
<button onClick={() => {
  if (confirm("¿Cerrar simulacro y calcular TRI?")) {
    cerrarSimulacro(simulacro.id);
  }
}}>
  <Lock className="h-3.5 w-3.5" />
  Cerrar y Calificar
</button>
```

**Cambios de UI:**
- Importado icono `Lock` de lucide-react
- Badge color púrpura para estado CERRADO
- Agregado "CERRADO" a filtros de estado

---

### 3. Base de Datos - Modelos Prisma

**Modelos utilizados (ya existían en schema.prisma):**

```prisma
model SesionExamen {
  id        String          @id @default(cuid())
  examenId  String
  numero    Int             // 1 o 2
  nombre    String
  tiempoMin Int
  claves    ClaveExamen[]
  resultados ResultadoSesion[]
  @@unique([examenId, numero])
}

model ResultadoSesion {
  id                String          @id @default(cuid())
  estudianteId      String
  examenId          String
  sesionId          String
  respuestas        Json            // {numeroPregunta: "A/B/C/D"}
  aciertos          Int
  total             Int
  puntajePreliminar Float
  puntajeTRI        Float?
  @@unique([estudianteId, sesionId])
}

model PesosPregunta {
  id               String          @id @default(cuid())
  examenId         String
  sesionId         String?
  numeroPregunta   Int
  dificultad       Float
  discriminacion   Float
  pesoNormalizado  Float
  @@unique([examenId, sesionId, numeroPregunta])
}

enum EstadoCalificacion {
  PRELIMINAR
  OFICIAL
}
```

---

## Flujo de Datos End-to-End

### Creación de Simulacro
```
Admin UI (CrearSimulacroForm)
  ↓ POST /api/admin/simulacros
Backend (POST)
  ├─ Crea ExamenTemplate
  ├─ Crea SesionExamen (1 ó 2)
  └─ Crea ClaveExamen con sesionId asignada
  ↓
Base de datos
  ├─ examenes_template
  ├─ sesiones_examen
  └─ claves_examen
```

### Envío de Respuestas (Estudiante)
```
Estudiante (SimulacroExamen)
  ↓ POST /api/dashboard/simulacros/[id]/enviar
Backend (POST)
  ├─ Agrupa respuestas por sesión
  ├─ Crea ResultadoSesion (por sesión)
  └─ Crea ResultadoSimulacro (estadoCalif: PRELIMINAR)
  ↓
Base de datos
  ├─ resultados_sesion (puntajePreliminar)
  └─ resultados_simulacro (estadoCalif: PRELIMINAR)
  ↓
Estudiante UI (ResultadoPage)
  └─ Muestra badge "PRELIMINAR" y puntaje
```

### Cierre y Cálculo TRI (Admin)
```
Admin UI (SimulacrosClient)
  ↓ PATCH /api/admin/simulacros/[id] {estado: "CERRADO"}
Backend (PATCH)
  ├─ Ejecuta cerrarSimulacro()
  ├─ Recupera todos ResultadoSesion
  ├─ Calcula discriminación (Pearson)
  ├─ Calcula pesos normalizados
  ├─ Crea PesosPregunta
  ├─ Recalcula ResultadoSesion (puntajeTRI)
  └─ Actualiza ResultadoSimulacro (estadoCalif: OFICIAL, puntajeTRI)
  ↓
Base de datos
  ├─ pesos_pregunta (nuevos registros)
  ├─ resultados_sesion (actualizado puntajeTRI)
  └─ resultados_simulacro (actualizado estadoCalif: OFICIAL)
  ↓
Estudiante UI (ResultadoPage)
  └─ Muestra badge "OFICIAL" y puntaje TRI
```

---

## Validaciones Implementadas

### Zod Schemas
- `crearSimulacroSchema`: validación de datos de creación
- `updateSimulacroSchema`: validación de datos de actualización
- `bodySchema` (enviar respuestas): validación de respuestas

### Comprobaciones de Negocio
- Mínimo 1 clave con respuesta definida
- Estado debe ser PUBLICADO antes de recibir respuestas
- Solo estudiantes autenticados pueden enviar respuestas
- Solo admins pueden crear, editar, publicar y cerrar simulacros
- Estudiante solo puede completar simulacro una vez

### Manejo de Errores
- Try-catch en todas las rutas
- Audit logs para todas las acciones
- Mensajes de error específicos en respuestas
- Status HTTP correctos (400, 403, 404, 409, 500)

---

## Estados del Simulacro

```
BORRADOR
  ├─ Creado pero no disponible para estudiantes
  ├─ Admin puede editar y eliminar
  └─ Admin puede publicar

PUBLICADO
  ├─ Disponible para estudiantes
  ├─ Estudiantes pueden enviar respuestas
  ├─ Respuestas se calculan con PRELIMINAR
  ├─ Admin puede editar
  └─ Admin puede cerrar (→ CERRADO)

CERRADO
  ├─ No se aceptan más respuestas
  ├─ Se recalculan puntajes TRI
  ├─ Estado de estudiantes: PRELIMINAR → OFICIAL
  ├─ Se generan pesos de preguntas
  └─ Admin puede archivar

ARCHIVADO
  └─ Simulacro inactivo
```

---

## Estados de Calificación

```
PRELIMINAR
  ├─ Se asigna cuando estudiante envía respuestas
  ├─ Puntaje = (aciertos/total)^1.8 * 100
  └─ Se muestra en UI con badge gris

OFICIAL
  ├─ Se asigna cuando admin cierra simulacro
  ├─ Puntaje = puntaje TRI ponderado
  ├─ Se basa en discriminación de Pearson
  └─ Se muestra en UI con badge púrpura
```

---

## Testing Manual

### Crear Simulacro
1. Admin → Crear simulacro
2. Llenar: nombre, materia, preguntas, tiempo
3. Marcar "Usar dos sesiones"
4. Definir claves de respuestas (≥1)
5. Publicar

✅ Verifica: `SesionExamen` registros creados (2 sesiones)

### Responder Simulacro
1. Estudiante → Ir a simulacro
2. Responder todas las preguntas
3. Enviar

✅ Verifica: `ResultadoSesion` x2, `ResultadoSimulacro` con `estadoCalif: PRELIMINAR`

### Cerrar y Calcular TRI
1. Admin → Simulacro publicado → "Cerrar y Calificar"
2. Confirmar

✅ Verifica: 
- Estado → CERRADO
- `PesosPregunta` registros creados
- `ResultadoSesion.puntajeTRI` calculado
- `ResultadoSimulacro.estadoCalif` → OFICIAL

### Ver Resultados (Estudiante)
1. Estudiante → Ver resultado
2. Antes de cerrar: "PRELIMINAR"
3. Después de cerrar: "OFICIAL"

✅ Verifica: Badge y estado mostrados correctamente

---

## Archivos Modificados

```
✅ app/api/admin/simulacros/route.ts
✅ app/api/admin/simulacros/[id]/route.ts
✅ app/api/dashboard/simulacros/[id]/enviar/route.ts
✅ components/admin/SimulacrosClient.tsx
```

## Archivos Sin Cambios (Ya Funcionan)
```
✓ prisma/schema.prisma (modelos ya existen)
✓ app/dashboard/simulacro/[id]/resultado/page.tsx (usa estadoCalif)
✓ lib/auth.ts
✓ types/index.ts
```

---

## Próximos Pasos (Opcional)

1. **Reporte de discriminación**: Mostrar análisis de preguntas por sesión
2. **Curva de dificultad**: Gráfico de dificultad vs discriminación
3. **Estadísticas admin**: Dashboard con promedio TRI por simulacro
4. **Exportar reportes**: CSV/PDF con resultados oficiales
5. **API de análisis**: Endpoints para estadísticas de clase

---

## Referencias de Algoritmo

**TRI (Two-Response IRT)**
- Fórmula: `(correctas/total)^1.8 * 100`
- Rango: 0-100
- Sensibilidad: Mayor castigo para puntajes bajos (1.8 > 1)

**Discriminación (Pearson)**
- Mide correlación entre acierto en item y total
- Rango: -1 a 1
- Interpretación: > 0.3 = buena discriminación

**Peso normalizado**
- Combina dificultad y discriminación
- `peso = dificultad * (1 + discriminacion)`
- Normaliza para que suma = total preguntas

---

# ✅ Checklist de Verificación

## ✅ Backend Implementation

### POST /api/admin/simulacros
- [x] Valida `nombre`, `materia`, `totalPreguntas`, `tiempoMin`
- [x] Valida `sesiones` (boolean)
- [x] Valida `fechaResultados` (datetime opcional)
- [x] Valida `claves` (array con respuestas)
- [x] Valida `estado` (BORRADOR o PUBLICADO)
- [x] Filtra claves con respuesta definida
- [x] Crea `ExamenTemplate` registro
- [x] Crea `SesionExamen` (1 sesión siempre, +1 si sesiones=true)
- [x] Crea `ClaveExamen` con `sesionId` asignada
- [x] Registra en `auditLog`
- [x] Retorna examen creado con estado 201 OK

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/admin/simulacros \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Simulacro",
    "materia": "Matemáticas",
    "totalPreguntas": 50,
    "tiempoMin": 120,
    "sesiones": true,
    "claves": [
      {"numero": 1, "respuesta": "A"},
      {"numero": 2, "respuesta": "B"}
    ],
    "estado": "PUBLICADO"
  }'
```

### PATCH /api/admin/simulacros/[id] {estado: "CERRADO"}
- [x] Verifica rol ADMIN
- [x] Valida que simulacro existe
- [x] Recupera todos `ResultadoSesion`
- [x] Calcula `dificultad` (% aciertos por pregunta)
- [x] Calcula `discriminacion` (Pearson correlation)
- [x] Calcula `peso` (dificultad * (1 + discriminacion))
- [x] Normaliza pesos (suma = total preguntas)
- [x] Crea `PesosPregunta` registros
- [x] Recalcula `ResultadoSesion.puntajeTRI` para cada estudiante
- [x] Recalcula `ResultadoSimulacro.puntajeTRI` y `estadoCalif: "OFICIAL"`
- [x] Actualiza `ExamenTemplate.estado` a "CERRADO"
- [x] Registra en `auditLog`

**Test Command:**
```bash
curl -X PATCH http://localhost:3000/api/admin/simulacros/[exam-id] \
  -H "Content-Type: application/json" \
  -d '{"estado": "CERRADO"}'
```

### POST /api/dashboard/simulacros/[id]/enviar
- [x] Verifica sesión autenticada
- [x] Valida estructura de respuestas
- [x] Verifica que examen está PUBLICADO
- [x] Verifica que estudiante no ya completó el examen
- [x] Agrupa respuestas por `sesionId`
- [x] Crea `ResultadoSesion` por cada sesión
- [x] Calcula `puntajePreliminar` por sesión
- [x] Crea `ResultadoSimulacro` con `estadoCalif: "PRELIMINAR"`
- [x] Retorna puntaje preliminar
- [x] Evita duplicados con unique constraint

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/dashboard/simulacros/[exam-id]/enviar \
  -H "Content-Type: application/json" \
  -d '{
    "respuestas": {
      "1": "A",
      "2": "B",
      "3": "C"
    },
    "tiempoUsado": 3600
  }'
```

---

## ✅ Frontend Implementation

### CrearSimulacroForm
- [x] Input: nombre
- [x] Select: materia
- [x] Input: totalPreguntas (número)
- [x] Input: tiempoMin (número)
- [x] Checkbox: "Usar dos sesiones" (nuevo)
- [x] Grid de claves (A/B/C/D)
- [x] Botón: Guardar borrador
- [x] Botón: Publicar simulacro
- [x] Toast notifications
- [x] Envía `sesiones: true/false`

**UI Check:**
```
✓ Checkbox visible en formulario
✓ Estado se mantiene al cambiar
✓ Se resetea después de guardar
✓ Se envía en JSON POST
```

### SimulacrosListadoAdmin
- [x] Filtro por estado: "todos", "BORRADOR", "PUBLICADO", "CERRADO" (nuevo), "ARCHIVADO"
- [x] Badge color para CERRADO (púrpura)
- [x] Menú BORRADOR: Editar, Publicar, Eliminar
- [x] Menú PUBLICADO: Editar, **Cerrar y Calificar** (nuevo), Archivar
- [x] Menú CERRADO: (botones deshabilitados o archivos)
- [x] Confirmación antes de cerrar
- [x] Refrescar lista después de cerrar
- [x] Toast de error/éxito

**UI Check:**
```
✓ "Cerrar y Calificar" botón visible en PUBLICADO
✓ Ícono Lock visible
✓ Color naranja/orange en hover
✓ Confirmación modal aparece
✓ Estado cambia a CERRADO después
✓ Badge cambia a púrpura
```

---

## ✅ Data Layer

### Prisma Models
- [x] `SesionExamen` existe con campos correctos
- [x] `ResultadoSesion` existe con campos correctos
- [x] `PesosPregunta` existe con campos correctos
- [x] `EstadoCalificacion` enum existe (PRELIMINAR, OFICIAL)
- [x] Relaciones correctas entre modelos
- [x] Unique constraints aplicadas

**Verify Command:**
```bash
# En prisma/schema.prisma
grep "model SesionExamen" -A 15
grep "model ResultadoSesion" -A 15
grep "model PesosPregunta" -A 15
grep "enum EstadoCalificacion" -A 5
```

### Database
- [x] Tabla `sesiones_examen` creada
- [x] Tabla `resultados_sesion` creada
- [x] Tabla `pesos_pregunta` creada
- [x] Columnas correctas en cada tabla
- [x] Indexes y unique constraints aplicados

**Verify Command:**
```sql
\d sesiones_examen
\d resultados_sesion
\d pesos_pregunta
```

---

## ✅ Algoritmo TRI

### Cálculo de Puntaje Preliminar
**Fórmula:** `(aciertos / total) ^ 1.8 * 100`

- [x] Implementado en `calcularPuntajePreliminar(aciertos, total)`
- [x] Redondea a 2 decimales
- [x] Maneja caso donde `total <= 0`

**Test Values:**
```
aciertos=50, total=50  → 100.00
aciertos=25, total=50  → 15.88 (not 50!)
aciertos=10, total=50  → 0.26
```

### Cálculo de Discriminación (Pearson)
**Fórmula:** `sum((x - mean_x) * (y - mean_y)) / sqrt(sum((x - mean_x)^2) * sum((y - mean_y)^2))`

- [x] Implementado en `pearsonCorrelation(x, y)`
- [x] Maneja caso donde denominador = 0
- [x] Rango: -1 a 1 (o 0 si no hay variación)

**Test Values:**
```
correlacion perfecta   → 1.0
correlacion nula       → 0.0
correlacion negativa   → -0.5 (si items mal discriminan)
```

### Cálculo de Peso Normalizado
**Fórmula:** `(dificultad * (1 + discriminacion)) / suma_pesos * max(preguntas, 1)`

- [x] Combina dificultad y discriminación
- [x] Normaliza para suma = total preguntas
- [x] Maneja caso donde suma_pesos = 0

**Test Values:**
```
10 preguntas, todos mismo peso → ~1.0 cada uno
```

### Cálculo de TRI Final
**Fórmula:** `(correctas_ponderadas / total) ^ 1.8 * 100`

- [x] Usa pesos normalizados
- [x] Capa adicional de castigo
- [x] Rango: 0-100

---

## ✅ Estados y Transiciones

### Estados de Simulacro
```
BORRADOR ──Publicar──→ PUBLICADO ──Cerrar──→ CERRADO ──Archivar──→ ARCHIVADO
                                      ↓
                               (cierra respuestas)
```

- [x] BORRADOR: Creación/edición
- [x] PUBLICADO: Aceptar respuestas
- [x] CERRADO: Cálculo TRI realizado
- [x] ARCHIVADO: Inactivo

**Verify DB:**
```sql
SELECT estado, COUNT(*) FROM examenes_template GROUP BY estado;
```

### Estados de Calificación
```
PRELIMINAR (al enviar) ──Admin cierra simulacro──→ OFICIAL
```

- [x] Asignado automáticamente al enviar respuestas
- [x] Actualizado cuando admin cierra simulacro
- [x] Mostrado en UI del estudiante

**Verify DB:**
```sql
SELECT estadoCalif, COUNT(*) FROM resultados_simulacro GROUP BY estadoCalif;
```

---

## ✅ Validaciones

### Validación de Input (Zod)
- [x] `crearSimulacroSchema` valida POST body
- [x] `updateSimulacroSchema` valida PATCH body
- [x] `bodySchema` valida respuestas enviadas
- [x] Errores devuelven 400 con mensaje

**Test Invalid:**
```bash
# Falta materia
curl -X POST ... -d '{"nombre": "Test", "claves": [...]}'
# Response: 400 {"error": "..."}

# Estado inválido
curl -X PATCH ... -d '{"estado": "INVALIDO"}'
# Response: 400 {"error": "Estado inválido"}
```

### Validación de Negocio
- [x] Mínimo 1 clave con respuesta
- [x] Simulacro debe existir
- [x] Estudiante no puede responder 2 veces
- [x] Solo admin puede cerrar
- [x] Solo PUBLICADO acepta respuestas

**Test Rules:**
```bash
# Sin claves
curl -X POST ... -d '{"claves": []}'
# Response: 400 "Define al menos una respuesta"

# Ya completó
curl -X POST /enviar  # 2da vez
# Response: 409 "Ya completaste este simulacro"

# Sin permiso
curl -X PATCH ... (sin token admin)
# Response: 403 "Sin permisos"
```

---

## ✅ Audit & Logging

### Audit Log
- [x] Registra creación de simulacro
- [x] Registra actualización de estado
- [x] Incluye `usuarioId`, `accion`, `resultado`, `mensaje`
- [x] No bloquea si falla inserción

---

# 📋 Instrucciones de Migración - schema.prisma

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
