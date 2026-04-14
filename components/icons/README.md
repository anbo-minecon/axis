# Sistema de Iconos SVG - AXIS Pre-ICFES

## Descripción

Sistema de iconos SVG personalizado para AXIS Pre-ICFES. Todos los iconos están creados en SVG puro sin dependencias externas.

## Estructura

### `index.tsx`
Componentes de iconos nucleares reutilizables:
- `LogoAxis` - Logo principal del sistema
- `IconSimulacro` - Simulacros
- `IconStats` - Estadísticas
- `IconRanking` - Ranking
- `IconMaterial` - Material de estudio
- `IconMessage` - Mensajes/Comunicación
- `IconProgress` - Progreso
- `IconCheck` - Checkmark
- `IconStar` - Estrella (ratings)
- `IconUsers` - Usuarios
- `IconClock` - Reloj/Tiempo
- `IconMatematicas` - Icono área Matemáticas
- `IconLectura` - Icono área Lectura
- `IconCiencias` - Icono área Ciencias
- `IconSociales` - Icono área Sociales
- `IconIngles` - Icono área Inglés
- `IconDownload`, `IconEdit`, `IconMenu`, `IconArrowRight`, `IconClose`, `IconChevronDown` - Utilities

### `AreaIcon.tsx`
Componente especializado para iconos de áreas ICFES:
```typescript
<AreaIcon icon="math" color="#8b5cf6" />
// math | lectura | ciencias | sociales | ingles
```

### `FeatureIcons.tsx`
Componente para iconos de features:
```typescript
<FeatureIcon type="simulacros" />
// simulacros | analytics | questions | results | plan | ranking | book | message | progress
```

## Uso

### En Componentes

```tsx
import { IconSimulacro, IconStar, LogoAxis } from "@/components/icons";
import { AreaIcon } from "@/components/icons/AreaIcon";
import { FeatureIcon } from "@/components/icons/FeatureIcons";

export function MyComponent() {
  return (
    <div>
      <LogoAxis width={40} height={40} />
      <IconStar width={24} height={24} className="text-yellow-400" />
      <AreaIcon icon="math" color="#8b5cf6" />
      <FeatureIcon type="simulacros" />
    </div>
  );
}
```

### Props

Todos los iconos soportan:
- `width?: number` - Ancho en píxeles (default: 24)
- `height?: number` - Alto en píxeles (default: 24)
- `className?: string` - Clases Tailwind
- `fill?: string` - Color de relleno
- `stroke?: string` - Color de trazo

## Ventajas

✅ **Sin dependencias externas** - No requiere librerías como Lucide, Font Awesome, etc.
✅ **Consistencia visual** - Todos los iconos siguen el mismo estilo
✅ **Personalizables** - Fácil ajustar colores, tamaño, estilos
✅ **Rendimiento** - SVG inline vs carga de imágenes
✅ **Tipado** - TypeScript full support
✅ **Escalable** - Responsive sin perder calidad

## Agregar Nuevos Iconos

1. Crear el SVG en Figma o editor
2. Exportar como SVG
3. Copiar el path/children del SVG
4. Agregar a `index.tsx`:

```tsx
export function IconNuevo({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      {/* Paths aquí */}
    </IconWrapper>
  );
}
```

## Paleta de Colores

- Azul principal: `#2563eb`
- Cian/Turquesa: `#06b6d4`
- Ámbar: `#f59e0b`
- Verde: `#10b981`
- Rojo: `#ef4444`
- Púrpura: `#8b5cf6`

## Nota sobre Images

La imagen hero en HeroSection ahora usa `/images/hero-students.jpg` (JPEG) en lugar de SVG para fotos reales.
