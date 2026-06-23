// lib/tri-engine.ts
// Motor de Calificación TRI Simplificado
// Basado en la documentación técnica del cliente (Documentación_Técnica__Motor_de_Calificación_Pre-ICFES_V2.pdf)

export interface RespuestaEstudiante {
  estudianteId: string;
  respuestas: Record<string, string>; // { "1": "A", "2": "B", ... }
}

export interface PesoPreguntaResult {
  numeroPregunta: number;
  dificultad: number;
  discriminacion: number;
  pesoBruto: number;
  pesoNormalizado: number;
}

export interface ResultadoTRI {
  estudianteId: string;
  puntajeTRI: number; // 0-100
  pesos: PesoPreguntaResult[];
}

// ── Correlación de Pearson entre dos arrays numéricos ─────────────────────
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num  += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ── Etapa 1: Calcular pesos dinámicos por pregunta ────────────────────────
export function calcularPesos(
  respuestasGrupo: RespuestaEstudiante[],
  claves: Record<string, string>,          // { "1": "A", "2": "B", ... }
  umbralExclusion = 0.05                   // excluir preguntas con < 5% de aciertos
): PesoPreguntaResult[] {
  const numEstudiantes = respuestasGrupo.length;
  if (numEstudiantes === 0) return [];

  const numerosPreguntas = Object.keys(claves).map(Number).sort((a, b) => a - b);
  const resultados: PesoPreguntaResult[] = [];

  // Puntaje total de cada estudiante (para calcular discriminación)
  const puntajesTotales = respuestasGrupo.map((e) =>
    numerosPreguntas.reduce((acc, num) => {
      const clave   = claves[String(num)]?.toUpperCase();
      const dada    = e.respuestas[String(num)]?.toUpperCase();
      return acc + (dada === clave ? 1 : 0);
    }, 0)
  );

  for (const num of numerosPreguntas) {
    const clave = claves[String(num)]?.toUpperCase();
    if (!clave) continue;

    // Vector binario: 1 si acertó, 0 si no
    const aciertosBin = respuestasGrupo.map((e) =>
      e.respuestas[String(num)]?.toUpperCase() === clave ? 1 : 0
    );

    const totalAciertos = aciertosBin.reduce((a, b) => a + b, 0 as number);
    const pctAcierto    = totalAciertos / numEstudiantes;

    // Excluir preguntas con muy pocos aciertos (evita outliers estadísticos)
    if (pctAcierto < umbralExclusion) continue;

    // Puntaje sin contar esta pregunta (para discriminación)
    const puntajeSinActual = puntajesTotales.map((p, i) => p - aciertosBin[i]);

    // Discriminación = correlación de Pearson
    let discriminacion = pearsonCorrelation(aciertosBin, puntajeSinActual);
    discriminacion     = Math.max(0, Math.min(discriminacion, 1)); // clamp [0,1]

    const dificultad = 1 - pctAcierto;           // mayor dificultad = más valor
    const pesoBruto  = dificultad * (1 + discriminacion);

    resultados.push({
      numeroPregunta: num,
      dificultad,
      discriminacion,
      pesoBruto,
      pesoNormalizado: 0, // se calcula después de tener todos los pesos
    });
  }

  // Normalizar pesos para que sumen 1
  const sumaPesos = resultados.reduce((a, r) => a + r.pesoBruto, 0);
  if (sumaPesos > 0) {
    for (const r of resultados) {
      r.pesoNormalizado = r.pesoBruto / sumaPesos;
    }
  }

  return resultados;
}

// ── Etapa 2: Calcular puntaje TRI por estudiante ──────────────────────────
export function calcularPuntajeTRI(
  respuestasEstudiante: Record<string, string>,
  claves: Record<string, string>,
  pesos: PesoPreguntaResult[],
  factorCurva = 1.5,
  puntajeMax  = 100
): number {
  let puntajeProporcional = 0;

  for (const peso of pesos) {
    const num   = String(peso.numeroPregunta);
    const clave = claves[num]?.toUpperCase();
    const dada  = respuestasEstudiante[num]?.toUpperCase();

    if (dada === clave) {
      puntajeProporcional += peso.pesoNormalizado;
    }
  }

  // Curva no lineal — simula la caída drástica del ICFES (1.5 como en modelo Python)
  // Con todo correcto: 1^1.5 * 100 = 100
  // Con un error en pregunta media: ~88
  const puntajeCurvado = Math.pow(puntajeProporcional, factorCurva);
  return Math.round(puntajeCurvado * puntajeMax);
}

// ── Cálculo preliminar (sin TRI, solo porcentaje con curva) ──────────────
// Usado al instante cuando el estudiante termina
export function calcularPuntajePreliminar(
  correctas: number,
  total: number,
  factorCurva = 1.5,
  puntajeMax  = 100
): number {
  if (total === 0) return 0;
  const proporcional = correctas / total;
  return Math.round(Math.pow(proporcional, factorCurva) * puntajeMax);
}

// ── Pipeline completo TRI para todos los estudiantes de un simulacro ──────
export function calcularTRIGrupo(
  respuestasGrupo: RespuestaEstudiante[],
  claves: Record<string, string>,
  factorCurva = 1.5
): {
  pesos:      PesoPreguntaResult[];
  resultados: Array<{ estudianteId: string; puntajeTRI: number }>;
} {
  // 1. Calcular pesos dinámicos con el comportamiento del grupo
  const pesos = calcularPesos(respuestasGrupo, claves);

  // 2. Si no hay pesos válidos, usar calificación simple
  if (pesos.length === 0) {
    return {
      pesos: [],
      resultados: respuestasGrupo.map((e) => {
        const correctas = Object.keys(claves).filter(
          (n) => e.respuestas[n]?.toUpperCase() === claves[n]?.toUpperCase()
        ).length;
        return {
          estudianteId: e.estudianteId,
          puntajeTRI:   calcularPuntajePreliminar(correctas, Object.keys(claves).length),
        };
      }),
    };
  }

  // 3. Calcular puntaje TRI por estudiante
  const resultados = respuestasGrupo.map((e) => ({
    estudianteId: e.estudianteId,
    puntajeTRI:   calcularPuntajeTRI(e.respuestas, claves, pesos, factorCurva),
  }));

  return { pesos, resultados };
}