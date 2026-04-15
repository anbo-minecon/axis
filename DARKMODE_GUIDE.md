# Dark Mode Implementation Guide

## 📱 Descripción

El sistema AXIS Pre-ICFES ahora soporta **Modo Oscuro (Dark Mode)** completo con:
- ✅ Persistencia en localStorage
- ✅ Detección automática de preferencia del sistema
- ✅ Toggle visual en el header de la landing
- ✅ Transiciones suaves entre modos
- ✅ Cobertura completa de componentes landing

---

## 🎨 Cómo Usar Dark Mode

### Para Usuarios

1. **Toggle en Header**: Haz clic en el ícono de Luna/Sol en la esquina superior derecha del header
2. **Preferencia del Sistema**: Si no seleccionas un modo, se usará la preferencia de tu dispositivo
3. **Persistencia**: Tu preferencia se guarda automáticamente

### Para Desarrolladores

#### Hook `useTheme`

```tsx
import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Tema actual: {theme}</p>
      <button onClick={toggleTheme}>Cambiar tema</button>
    </div>
  );
}
```

#### Estilos Tailwind Dark Mode

```tsx
// Aplicar estilos diferentes en dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Contenido responsive al tema
</div>
```

---

## 🔧 Estructura Técnica

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `hooks/useTheme.ts` | Hook para acceder al contexto del tema |
| `components/shared/ThemeProvider.tsx` | Provider que gestiona el estado del tema |
| `components/shared/ThemeToggle.tsx` | Botón toggle Sun/Moon |
| `app/layout.tsx` | Script SSR para evitar FOUC |
| `app/globals.css` | Variables CSS para ambos modos |

### Variables CSS

**Modo Claro (Light)**
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1f2937;
  --text-muted: #6b7280;
}
```

**Modo Oscuro (Dark)**
```css
html.dark {
  --bg-primary: #060b18;
  --bg-secondary: #0d1526;
  --text-primary: #f0f4ff;
  --text-muted: #8899bb;
}
```

---

## 📋 Componentes Actualizados

### Landing Page
- ✅ Navigation (header con toggle)
- ✅ HeroSection
- ✅ Caracteristicas
- ✅ WhyAXIS
- ✅ HowItWorks
- ✅ Testimonials
- ✅ ImpactStats
- ✅ EducationalResources
- ✅ PricingPlans
- ✅ FAQ
- ✅ FinalCTA
- ✅ Footer

### Cobertura
- **100%** Landing page completa
- **Parcial** Dashboard (pueden actualizarse según necesidad)
- **Parcial** Páginas de Auth (pueden actualizarse según necesidad)

---

## 🎯 Mejores Prácticas

### Usar Transiciones Suaves
```tsx
<div className="bg-white dark:bg-gray-900 transition-colors duration-300">
```

### Colores Específicos para Dark Mode
```tsx
// ❌ Evitar
<div className="text-blue-600">

// ✅ Preferir
<div className="text-blue-600 dark:text-blue-400">
```

### Bordes y Sombras
```tsx
// Para bordes
className="border-gray-200 dark:border-gray-700"

// Para sombras
className="shadow-md dark:shadow-lg"
```

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Dark mode para Dashboard
- [ ] Dark mode para páginas de Auth
- [ ] Selector de temas personalizables
- [ ] Transiciones animadas al cambiar tema
- [ ] Más variantes de color para diferentes modos

---

## ⚡ Rendimiento

- **Script SSR**: Se ejecuta en el `<head>` para evitar flash
- **localStorage**: Persistencia eficiente
- **Transiciones CSS**: No afecta el rendimiento
- **Clases Tailwind**: Generadas en build time

---

## 🐛 Troubleshooting

### El tema no persiste
- Verificar que localStorage no está deshabilitado
- Limpiar cache del navegador

### Flash de contenido sin estilos
- El script SSR en `app/layout.tsx` debe ejecutarse primero
- Verificar que `suppressHydrationWarning` está en el tag `<html>`

### Estilos no aplicados en dark mode
- Revisar que las clases usen formato `dark:className`
- No usar la clase `dark` directamente en la raíz

---

## 📞 Contacto

Para preguntas sobre la implementación de dark mode, contacta al equipo de frontend.
