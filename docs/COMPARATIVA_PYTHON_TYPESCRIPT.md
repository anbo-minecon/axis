# 📊 COMPARATIVA: Código Python vs. Sistema TypeScript Actual

## 📋 RESUMEN EJECUTIVO

| Aspecto | Python | TypeScript | Estado |
|---------|--------|-----------|--------|
| **Factor curva** | 1.5 | 1.5 | ✅ IGUAL |
| **Cálculo de pesos** | Solo dificultad | Dificultad + Discriminación | 🆙 TS MEJOR |
| **Por componentes** | ✅ Sí (3+ áreas) | ❌ No (1 global) | ⚠️ DIFERENTE |
| **Límites (min/max)** | 10-100 | 0-100 | ⚠️ DIFERENTE |
| **Normalización** | ✅ Pesos suman 1 | ✅ Pesos suman 1 | ✅ IGUAL |
| **Fórmula curva** | `(prop ^ 1.5) * 100` | `(prop ^ 1.5) * 100` | ✅ IGUAL |

---

## 🔍 ANÁLISIS LÍNEA POR LÍNEA

### ETAPA 1: Cálculo de Pesos

#### Python
```python
def analizar_pesos(df_respuestas, df_clave_limpia):
    pesos_por_area = {}
    areas = df_clave_limpia['Componente'].unique()
    
    for area in areas:  # ← ITERA POR COMPONENTE
        df_sub_clave = df_clave_limpia[df_clave_limpia['Componente'] == area]
        preguntas_area = df_sub_clave['Pregunta'].tolist()
        
        for col in preguntas_area:
            aciertos = (respuestas_alumnos == clave_correcta).sum()
            porcentaje_acierto = aciertos / num_estudiantes
            dificultad = 1 - porcentaje_acierto  # ← DIFICULTAD BÁSICA
            
            peso_bruto = dificultad if dificultad > 0 else 0.1  # ← SOLO DIFICULTAD
            resultados.append({'Pregunta': col, 'Peso_Bruto': peso_bruto})
        
        df_pesos['Peso_Normalizado'] = df_pesos['Peso_Bruto'] / df_pesos['Peso_Bruto'].sum()
        pesos_por_area[area] = df_pesos
    
    return pesos_por_area
```

**Lógica:**
1. Agrupa preguntas por componente
2. Por cada pregunta: calcula % aciertos
3. Dificultad = 1 - % aciertos
4. **Peso bruto = dificultad** (SIN discriminación)
5. Normaliza por componente

---

#### TypeScript (Actual)
```typescript
export function calcularPesos(
  respuestasGrupo: RespuestaEstudiante[],
  claves: Record<string, string>,
  umbralExclusion = 0.05
): PesoPreguntaResult[] {
  // ... NO AGRUPA POR COMPONENTE, TODO GLOBAL
  
  for (const num of numerosPreguntas) {  // ← TODO DE UNA VEZ
    const aciertosBin = respuestasGrupo.map((e) =>
      e.respuestas[String(num)]?.toUpperCase() === clave ? 1 : 0
    );
    
    const pctAcierto = totalAciertos / numEstudiantes;
    
    if (pctAcierto < 0.05) continue;  // ← EXCLUYE SI < 5% aciertos
    
    // DISCRIMINACIÓN: Correlación de Pearson
    const puntajeSinActual = puntajesTotales.map((p, i) => p - aciertosBin[i]);
    let discriminacion = pearsonCorrelation(aciertosBin, puntajeSinActual);
    
    const dificultad = 1 - pctAcierto;
    const pesoBruto = dificultad * (1 + discriminacion);  // ← DIFICULTAD * (1 + DISCRIMINACIÓN)
    
    resultados.push({ numeroPregunta: num, dificultad, discriminacion, pesoBruto, ... });
  }
  
  // Normalizar pesos para que sumen 1
  const sumaPesos = resultados.reduce((a, r) => a + r.pesoBruto, 0);
  for (const r of resultados) {
    r.pesoNormalizado = r.pesoBruto / sumaPesos;
  }
  
  return resultados;
}
```

**Lógica:**
1. **NO agrupa por componente** (TODO global)
2. Por cada pregunta: calcula % aciertos
3. Dificultad = 1 - % aciertos
4. **Discriminación = Correlación de Pearson** (AGREGADO)
5. **Peso bruto = dificultad × (1 + discriminación)**
6. Excluye preguntas con <5% aciertos (BUG FIX vs. Python)
7. Normaliza global

---

### ETAPA 2: Cálculo de Notas por Estudiante

#### Python
```python
def calcular_notas(df_respuestas, df_clave_limpia, pesos_por_area):
    for _, alumno in df_respuestas.iterrows():
        notas_alumno = {'Nombre': nombre}
        suma_global = 0
        total_areas = 0
        
        for area, df_pesos in pesos_por_area.items():  # ← POR CADA COMPONENTE
            puntaje_proporcional = 0
            df_sub_clave = df_clave_limpia[df_clave_limpia['Componente'] == area]
            claves_area = df_sub_clave.set_index('Pregunta')['Clave']
            
            for _, info_pregunta in df_pesos.iterrows():
                pregunta = info_pregunta['Pregunta']
                peso = float(info_pregunta['Peso_Normalizado'])
                clave_correcta = str(claves_area[pregunta]).strip()
                resp_alumno = limpiar_respuesta(alumno[pregunta])
                
                if resp_alumno == clave_correcta:
                    puntaje_proporcional += peso  # ← SUMA PESOS DONDE ACERTÓ
            
            # FÓRMULA CURVA
            nota_curva = round((puntaje_proporcional ** 1.5) * 100)
            # LÍMITES: 10-100
            notas_alumno[area] = int(max(10, min(nota_curva, 100)))
            
            suma_global += notas_alumno[area]
            total_areas += 1
        
        # PROMEDIA ÁREAS
        notas_alumno['Global'] = int(round(suma_global / total_areas))
        resultados_finales.append(notas_alumno)
    
    return resultados_finales
```

**Lógica:**
1. Por cada estudiante
2. Por cada componente (Mate, Lenguaje, Ciencias)
   - Suma pesos donde acertó
   - Aplica curva: `(prop ^ 1.5) * 100`
   - **Limita entre 10-100**
3. Nota global = promedio de componentes
4. Resultado: `{ Matemáticas: 92, Lenguaje: 78, Ciencias: 85, Global: 85 }`

---

#### TypeScript (Actual)
```typescript
export function calcularPuntajeTRI(
  respuestasEstudiante: Record<string, string>,
  claves: Record<string, string>,
  pesos: PesoPreguntaResult[],
  factorCurva = 1.5,
  puntajeMax = 100
): number {
  let puntajeProporcional = 0;
  
  for (const peso of pesos) {
    const num = String(peso.numeroPregunta);
    const clave = claves[num]?.toUpperCase();
    const dada = respuestasEstudiante[num]?.toUpperCase();
    
    if (dada === clave) {
      puntajeProporcional += peso.pesoNormalizado;  // ← SUMA PESOS DONDE ACERTÓ
    }
  }
  
  // FÓRMULA CURVA
  const puntajeCurvado = Math.pow(puntajeProporcional, factorCurva);
  // NO HAY LÍMITES
  return Math.round(puntajeCurvado * puntajeMax);
}

export function calcularTRIGrupo(
  respuestasGrupo: RespuestaEstudiante[],
  claves: Record<string, string>,
  factorCurva = 1.5
) {
  const pesos = calcularPesos(respuestasGrupo, claves);
  
  // Calcula TRI por estudiante (SOLO UN PUNTAJE GLOBAL)
  const resultados = respuestasGrupo.map((e) => ({
    estudianteId: e.estudianteId,
    puntajeTRI: calcularPuntajeTRI(e.respuestas, claves, pesos, factorCurva),  // ← UNO SOLO
  }));
  
  return { pesos, resultados };
}
```

**Lógica:**
1. Por cada estudiante
   - **SIN COMPONENTES** (TODO global)
   - Suma pesos donde acertó
   - Aplica curva: `(prop ^ 1.5) * 100`
   - **NO limita** (0-100 natural por la fórmula)
2. Resultado: `{ estudianteId: "x", puntajeTRI: 82 }` (UN SOLO número)

---

## 📊 TABLA COMPARATIVA DETALLADA

### Paso 1: Agrupar por Componente

| Python | TypeScript |
|--------|-----------|
| ✅ Agrupa preguntas por componente | ❌ NO agrupa (todo global) |
| `for area in areas:` | `for const num of numerosPreguntas:` |
| Crea `pesos_por_area = { "Mate": {...}, "Lenguaje": {...} }` | Crea `pesos = [...]` (un array, no dict por componente) |

---

### Paso 2: Calcular Peso Bruto por Pregunta

| Python | TypeScript |
|--------|-----------|
| `peso_bruto = dificultad` | `peso_bruto = dificultad * (1 + discriminacion)` |
| Dificultad = 1 - % aciertos | Dificultad = 1 - % aciertos ✓ |
| SIN discriminación | ✅ INCLUYE Correlación de Pearson |
| **Menos precisión** | **Mayor precisión** |

---

### Paso 3: Normalizar Pesos

| Python | TypeScript |
|--------|-----------|
| `Peso_Normalizado = Peso_Bruto / Σ(Peso_Bruto)` | `pesoNormalizado = pesoBruto / sumaPesos` |
| Por componente (cada área suma 1) | Global (todos suman 1) |
| ✅ IGUAL LÓGICA | ✅ IGUAL LÓGICA |

---

### Paso 4: Calcular Puntaje por Estudiante

| Python | TypeScript |
|--------|-----------|
| **POR COMPONENTE** | **GLOBAL** |
| Para Matemáticas: suma pesos acertados | Suma todos los pesos acertados |
| Para Lenguaje: suma pesos acertados | Un solo resultado |
| Para Ciencias: suma pesos acertados | |
| Aplica curva 3 veces | Aplica curva 1 vez |
| Resultado: `Mate: 92, Lenguaje: 78, Ciencias: 85` | Resultado: `puntajeTRI: 82` |

---

### Paso 5: Aplicar Curva

| Python | TypeScript |
|--------|-----------|
| `(puntaje_proporcional ^ 1.5) * 100` | `(puntajeProporcional ^ 1.5) * 100` |
| ✅ FÓRMULA IDÉNTICA | ✅ FÓRMULA IDÉNTICA |

---

### Paso 6: Limitar Rango

| Python | TypeScript |
|--------|-----------|
| `max(10, min(nota_curva, 100))` | Sin límites (0-100 natural) |
| Nota mínima: 10 | Nota mínima: 0 |
| Nota máxima: 100 | Nota máxima: 100 |
| **DIFERENCIA IMPORTANTE** | |

---

### Paso 7: Calcular Global

| Python | TypeScript |
|--------|-----------|
| `suma_global / total_areas` | N/A (no hay componentes) |
| Promedia las 3 áreas | No aplica |
| `Global = (92 + 78 + 85) / 3 = 85` | N/A |

---

## ✅ LO QUE ES IGUAL

1. **Factor curva: 1.5** ✅ (ahora igual, antes era 1.8 en TS)
2. **Fórmula curva:** `(x ^ 1.5) * 100` ✅
3. **Normalización de pesos:** Suman 1 ✅
4. **Cálculo de dificultad:** `1 - % aciertos` ✅
5. **Suma pesos donde acertó** ✅

---

## 🔴 LO QUE ES DIFERENTE

### #1 COMPONENTES/ÁREAS
| Python | TypeScript |
|--------|-----------|
| ✅ Calcula por área | ❌ Solo global |
| 3+ puntajes (Mate, Lenguaje, Ciencias, Global) | 1 puntaje (Global) |
| **Requiere:** Agregar `componente` a BD y lógica TRI |

### #2 PESO BRUTO
| Python | TypeScript |
|--------|-----------|
| `dificultad` | `dificultad * (1 + discriminación)` |
| Menos precisión | ✅ MÁS PRECISIÓN (mejor) |
| No diferencia si pregunta discrimina | Diferencia preguntas que discriminan bien |

### #3 LÍMITES
| Python | TypeScript |
|--------|-----------|
| 10-100 (piso de 10) | 0-100 (sin piso) |
| Nota mínima: 10 (inflada) | Nota mínima: ~0 (realista) |
| **Impacto:** Python favorece estudiantes malos | TS es más justo |

### #4 EXCLUSIÓN PREGUNTAS
| Python | TypeScript |
|--------|-----------|
| Incluye TODAS las preguntas | ❌ Excluye preguntas con <5% aciertos |
| Si 1 pregunta la responden 3 de 100 → se incluye | Se excluye como posible defecto |
| **Impacto:** TS más robusto | |

---

## 📈 EJEMPLO REAL: 100 estudiantes

### Escenario
- **Pregunta 1:** 97 aciertos
- **Pregunta 2:** 50 aciertos  
- **Pregunta 3:** 3 aciertos ← Outlier

### Python
```
Pregunta 1: dificultad = 0.03 → peso_bruto = 0.03
Pregunta 2: dificultad = 0.50 → peso_bruto = 0.50
Pregunta 3: dificultad = 0.97 → peso_bruto = 0.97  ← INCLUIDA

Pesos normalizados: [0.02, 0.35, 0.63]
Si aciertas P1 y P3: puntaje = (0.02 + 0.63) = 0.65
Nota: (0.65 ^ 1.5) * 100 = 52 → Mostrada como 52 (no limitada aquí)
```

### TypeScript
```
Pregunta 1: dificultad = 0.03, discriminación = 0.9 → peso = 0.03 * 1.9 = 0.057
Pregunta 2: dificultad = 0.50, discriminación = 0.7 → peso = 0.50 * 1.7 = 0.85
Pregunta 3: dificultad = 0.97, discriminación = 0.2 → 3% < 5% → EXCLUIDA ❌

Pesos normalizados: [0.063, 0.937]
Si aciertas P1 y P2: puntaje = (0.063 + 0.937) = 1.0
Nota: (1.0 ^ 1.5) * 100 = 100 ✓

Si solo aciertas P2: puntaje = 0.937
Nota: (0.937 ^ 1.5) * 100 = 91 ✓
```

**Conclusión:** 
- Python incluye pregunta sospechosa (P3)
- TypeScript la excluye (más robusto)

---

## 🎯 RECOMENDACIONES

### Hoy (✅ HECHO)
1. **Factor curva 1.5** ✅
2. **Página resultado con puntajeEfectivo** ✅
3. **Discriminación de Pearson en BD** ✅ (mejor que Python)

### Próximamente (⏳ TODO)
1. **Implementar componentes** (ver `CAMBIOS_TRI_2026.md`)
   - Agregar `componente` a `ClaveExamen`
   - Modificar `calcularTRIPorComponente()`
   - Mostrar UI con 3+ áreas

2. **Considerar límites 10-100** (⚠️ OPCIONAL)
   - Mantener 0-100 es más justo
   - Python tiene piso artificial en 10

3. **Umbral de exclusión configurable**
   - Actual: 5%
   - Podría ser 1-3% para grupos pequeños

---

## 🏆 VEREDICTO FINAL

```
SIMILITUD: ~70%
- Fórmula base: 100% igual
- Cálculo por componente: 0% (falta en TS)
- Cálculo de peso: 80% (TS MEJORADO con discriminación)
- Normalización: 100% igual
- Límites: 50% diferente (TS más justo)
```

**TypeScript es MEJOR que Python en:**
- ✅ Incluye discriminación (Pearson)
- ✅ Excluye preguntas sospechosas
- ✅ Sin límites artificiales (10-100)
- ✅ Factor curva 1.5 igual

**Python tiene lo que falta en TypeScript:**
- ❌ Componentes/áreas (REQUIERE IMPLEMENTACIÓN)

