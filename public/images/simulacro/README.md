# Imágenes de Simulacros

Esta carpeta contiene las imágenes por defecto para cada simulacro según su materia.

## Estructura esperada

Agrega los archivos de imagen con los siguientes nombres:

```
simulacro/
├── matematicas.jpg                 # Para Matemáticas
├── lectura-critica.jpg             # Para Lectura Crítica
├── ciencias-naturales.jpg          # Para Ciencias Naturales
├── sociales-ciudadanas.jpg         # Para Sociales y Ciudadanas
├── ingles.jpg                      # Para Inglés
└── default.jpg                     # Imagen por defecto (fallback)
```

## Especificaciones de imagen

- **Formato**: JPG, PNG
- **Resolución mínima**: 400x300 px
- **Resolución recomendada**: 600x400 px
- **Peso máximo**: 500 KB por imagen

## Mapeo automático

El sistema automáticamente selecciona la imagen correcta según el nombre de la materia:

```typescript
const MATERIA_IMAGEN_MAP = {
  "Matemáticas": "/images/simulacro/matematicas.jpg",
  "Lectura Crítica": "/images/simulacro/lectura-critica.jpg",
  "Ciencias Naturales": "/images/simulacro/ciencias-naturales.jpg",
  "Sociales y Ciudadanas": "/images/simulacro/sociales-ciudadanas.jpg",
  "Inglés": "/images/simulacro/ingles.jpg",
};
```

Si la imagen no existe o falla la carga, se mostrará un gradiente de fondo de color.
