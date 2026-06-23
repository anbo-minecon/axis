# Importación de Simulacros con Soporte para Sesiones

## Resumen de Cambios

A partir de la actualización de 2026, el sistema de importación de simulacros ahora soporta:

1. **Campo `sesion` (opcional)** - Asigna preguntas a sesiones específicas (1 o 2)
2. **Detección automática de 2 sesiones** - Si encuentras preguntas con sesion=1 y sesion=2, crea un simulacro multi-sesión
3. **Campo `dificultad` (opcional)** - Especifica la dificultad de cada pregunta (facil, media, dificil)

## Formato del Archivo Excel

### Columnas obligatorias

- **simulacro** (número o texto): Identificador del simulacro
- **materia** (texto): Nombre de la materia (ej: "Matemáticas", "Lectura Crítica")
- **pregunta** (número): Número de pregunta (ej: 1, 2, 3...)
- **respuesta_correcta** (letra): Respuesta correcta (A, B, C o D)

### Columnas opcionales

- **sesion** (1 o 2, default: 1): A cuál sesión pertenece la pregunta
- **dificultad** (facil, media, dificil; default: media): Nivel de dificultad

## Ejemplos

### Ejemplo 1: Simulacro de sesión única (tradicional)

```
simulacro | materia        | pregunta | respuesta_correcta | sesion | dificultad
1         | Matemáticas    | 1        | B                  | 1      | media
1         | Matemáticas    | 2        | D                  | 1      | facil
1         | Matemáticas    | 3        | A                  | 1      | dificil
```

**Resultado**: Crea un simulacro con 3 preguntas en una sola sesión.

### Ejemplo 2: Simulacro de 2 sesiones

```TSX
simulacro | materia         | pregunta | respuesta_correcta | sesion | dificultad
2         | Lectura Crítica | 1        | C                  | 1      | media
2         | Lectura Crítica | 2        | A                  | 1      | facil
2         | Lectura Crítica | 3        | D                  | 2      | media
2         | Lectura Crítica | 4        | B                  | 2      | dificil
```

**Resultado**: Crea un simulacro con 2 sesiones:

- **Sesión 1**: Preguntas 1, 2 (60 minutos)
- **Sesión 2**: Preguntas 3, 4 (60 minutos)

### Ejemplo 3: Simulacro sin columna `sesion` (compatible con versiones anteriores)

```
simulacro | materia       | pregunta | respuesta_correcta | dificultad
3         | Sociales      | 1        | B                  | media
3         | Sociales      | 2        | A                  | facil
```

**Resultado**: Todas las preguntas se asignan a sesión 1 (comportamiento por defecto).

### Ejemplo 4: Simulacro sin columnas opcionales (máxima compatibilidad)

```
simulacro | materia    | pregunta | respuesta_correcta
4         | Inglés     | 1        | C
4         | Inglés     | 2        | A
```

**Resultado**: Crea simulacro con sesión única, dificultad = "media" para todas.

## Validaciones

### Validaciones de cada fila

- ✅ `simulacro`: No puede estar vacío
- ✅ `materia`: No puede estar vacía
- ✅ `pregunta`: Debe ser un número entero ≥ 1
- ✅ `respuesta_correcta`: Debe ser A, B, C o D
- ✅ `sesion`: Si se especifica, debe ser 1 o 2 (default: 1)
- ✅ `dificultad`: Si se especifica, debe ser "facil", "media" o "dificil" (default: "media")

### Validaciones globales

- ❌ No se pueden duplicar preguntas en la **misma sesión** del mismo simulacro
- ✅ Se pueden duplicar preguntas si están en **sesiones diferentes**
- ⚠️ Si dificultad no es válida, se asume "media" sin rechazar la fila

## Flujo de Procesamiento

1. **Lectura del Excel** → Se parsean todas las filas
2. **Validación fila por fila** → Se validan datos, se rechazan filas inválidas
3. **Agrupación por simulacro** → Se detectan sesiones (1 o 2)
4. **Creación de ExamenTemplate**:
   - Si solo hay sesion=1: Crea simulacro de **sesión única**
   - Si hay sesion=1 y sesion=2: Crea simulacro de **2 sesiones**
5. **Creación de SesionExamen** → Se crean las sesiones correspondientes
6. **Asignación de ClaveExamen** → Las preguntas se asignan a su sesión

## Cálculo de TRI con Sesiones

Una vez importado, el sistema:

1. **Calcula TRI por cada sesión** usando solo las preguntas de esa sesión
2. **Consolida el puntaje global** como promedio ponderado:
   ```
   TRI_global = (TRI_sesion1 × total_preguntas_sesion1 + TRI_sesion2 × total_preguntas_sesion2)
                / (total_preguntas_sesion1 + total_preguntas_sesion2)
   ```

## Descarga de Plantilla

Desde el panel de admin **"Importar Excel"** → botón **"Descargar plantilla Excel"**

La plantilla incluye un ejemplo con:

- 3 preguntas de matemáticas (sesión 1)
- 1 pregunta de lectura crítica (sesión 1)
- 1 pregunta de lectura crítica (sesión 2)

Puedes editar y duplicar filas según tus necesidades.

## Preguntas Frecuentes

### ¿Qué pasa si no incluyo la columna "sesion"?

Todas las preguntas se asignan a sesión 1 (comportamiento por defecto). El simulacro será de sesión única.

### ¿Puedo cambiar la columna "dificultad" después de importar?

Sí, edita el simulacro desde el panel de admin o usa la API PUT `/api/admin/simulacros/[id]`.

### ¿Cómo creo un simulacro de 3 sesiones?

El sistema actualmente soporta máximo 2 sesiones. Si necesitas más, contacta al equipo de desarrollo.

### ¿Se pueden importar exámenes con sesiones desiguales (ej: 5 preguntas en sesión 1, 3 en sesión 2)?

Sí, completamente. El cálculo de TRI automáticamente pondera por cantidad de preguntas en cada sesión.

### ¿Qué pasa si una pregunta aparece en sesión 1 y también en sesión 2?

La primera aparición se registra, el duplicado se rechaza con un error en el reporte.

## Errores Comunes

| Error                           | Causa                                | Solución                                                             |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| "número de pregunta inválido" | La columna pregunta no es un número | Usa formato numérico (1, 2, 3...)                                    |
| "respuesta no válida"          | Respuesta no es A, B, C o D          | Cambia a una de las 4 opciones válidas                               |
| "sesión no válida"            | Sesion no es 1 o 2                   | Usa solo 1 o 2, o deja vacío                                         |
| "pregunta duplicada"            | Misma pregunta en misma sesión      | Cada pregunta/sesión solo puede aparecer una vez                     |
| "Falta la columna obligatoria"  | No incluiste columna requerida       | Asegúrate de tener: simulacro, materia, pregunta, respuesta_correcta |

## Historial de Cambios

### v2.0 (2026)

✅ Soporte para importación con columna `sesion`
✅ Detección automática de simulacros de 2 sesiones
✅ Validación de valores de sesion (1 o 2)
✅ Campo `dificultad` como opcional
✅ Plantilla Excel actualizada

### v1.0 (anterior)

- Solo soportaba simulacros de sesión única
- No había campo sesion
- Dificultad era calculada automáticamente

## Soporte

Para preguntas o reportar problemas, contacta al equipo de desarrollo.
