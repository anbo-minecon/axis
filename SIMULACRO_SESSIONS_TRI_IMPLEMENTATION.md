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
