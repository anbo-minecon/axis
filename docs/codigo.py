# ==========================================
# 🧠 MOTOR MATEMÁTICO (PESOS Y CURVA)
# ==========================================
def limpiar_respuesta(val):
    if pd.isna(val) or val == "": return ""
    texto = str(val).upper()
    if "OPCIÓN" in texto:
        texto = texto.replace("OPCIÓN", "")
    return texto.strip()

def analizar_pesos(df_respuestas, df_clave_limpia):
    pesos_por_area = {}
    num_estudiantes = len(df_respuestas)
    areas = df_clave_limpia['Componente'].unique()

    for area in areas:
        df_sub_clave = df_clave_limpia[df_clave_limpia['Componente'] == area]
        preguntas_area = df_sub_clave['Pregunta'].tolist()
        claves_area = df_sub_clave.set_index('Pregunta')['Clave']

        resultados = []
        for col in preguntas_area:
            if col not in df_respuestas.columns: continue

            clave_correcta = str(claves_area[col]).strip()
            respuestas_alumnos = df_respuestas[col].apply(limpiar_respuesta)

            aciertos = (respuestas_alumnos == clave_correcta).sum()
            porcentaje_acierto = aciertos / num_estudiantes if num_estudiantes > 0 else 0
            dificultad = 1 - porcentaje_acierto

            peso_bruto = dificultad if dificultad > 0 else 0.1
            resultados.append({'Pregunta': col, 'Peso_Bruto': peso_bruto})

        df_pesos = pd.DataFrame(resultados)
        if not df_pesos.empty and df_pesos['Peso_Bruto'].sum() > 0:
            df_pesos['Peso_Normalizado'] = df_pesos['Peso_Bruto'] / df_pesos['Peso_Bruto'].sum()
        else:
            df_pesos['Peso_Normalizado'] = 0

        pesos_por_area[area] = df_pesos

    return pesos_por_area

def calcular_notas(df_respuestas, df_clave_limpia, pesos_por_area):
    resultados_finales = []
    col_nombre = [c for c in df_respuestas.columns if 'nombre' in c.lower()][0]

    for _, alumno in df_respuestas.iterrows():
        nombre = str(alumno[col_nombre]).strip()
        if nombre.lower() in ['nan', '', 'nat']: continue

        notas_alumno = {'Nombre': nombre}
        suma_global = 0
        total_areas = 0

        for area, df_pesos in pesos_por_area.items():
            if isinstance(df_pesos, int) or df_pesos.empty: continue

            puntaje_proporcional = 0
            df_sub_clave = df_clave_limpia[df_clave_limpia['Componente'] == area]
            claves_area = df_sub_clave.set_index('Pregunta')['Clave']

            for _, info_pregunta in df_pesos.iterrows():
                pregunta = info_pregunta['Pregunta']
                peso = float(info_pregunta['Peso_Normalizado'])
                clave_correcta = str(claves_area[pregunta]).strip()
                resp_alumno = limpiar_respuesta(alumno[pregunta])

                if resp_alumno == clave_correcta:
                    puntaje_proporcional += peso

            nota_curva = round((puntaje_proporcional ** 1.5) * 100)
            notas_alumno[area] = int(max(10, min(nota_curva, 100)))
            suma_global += notas_alumno[area]
            total_areas += 1

        notas_alumno['Global'] = int(round(suma_global / total_areas)) if total_areas > 0 else 0
        resultados_finales.append(notas_alumno)

    return resultados_finales

