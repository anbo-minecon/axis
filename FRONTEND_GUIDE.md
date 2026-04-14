# Frontend AXIS - Guía Rápida

## ✅ Lo que está listo

### 1. **Componentes Base**
- **Sidebar** (`components/shared/Sidebar.tsx`): Navegación con icono de suscripción
- **DashboardLayout** (`components/shared/DashboardLayout.tsx`): Protege rutas autenticadas  
- **Hooks** (`hooks/useUser.ts`): 
  - `useUser()` - obtiene perfil
  - `useSuscripcion()` - verifica suscripción
  - `useAcceso()` - verifica acceso a funciones

### 2. **Páginas Autenticación**
- **Login** (`app/auth/login/page.tsx`): 
  - Email + contraseña con NextAuth
  - Google OAuth
  - Integrado con backend

- **Registro** (`app/auth/registro/registro-form.tsx`):
  - Nombre, email, contraseña
  - Colegio, grado, ciudad
  - Validación Zod
  - Llama a `trpc.auth.registro`

### 3. **Dashboard Principal** 
`app/dashboard/page.tsx`:
- Stats: Simulacros completados, puntaje más alto, ranking, promedio
- Gráfico circular de puntaje actual
- Rendimiento por materia (5 áreas)
- Actividad reciente (últimos 3 simulacros)
- Promo de suscripción si no tiene plan

### 4. **Página de Planes**
`app/dashboard/planes/page.tsx`:
- 3 planes: Básico (gratis), Pro ($29.990), Premium ($49.990)
- Comparativa de características
- Plan más popular destacado
- FAQ
- Botón de contacto soporte

### 5. **Colores y Branding**
- Agregados a `tailwind.config.ts`:
  - `axis-azul` (#1e5ab1)
  - `axis-azul-dark` (#0d3d7a)

---

## ⏳ Próximos Pasos Recomendados

### Inmediato (para probar el sistema)

1. **Actualizar la página login** - Aún tiene código viejo:
   ```bash
   app/auth/login/page.tsx # Ya está actualizado, verificar
   ```

2. **Probar el flujo completo**:
   ```bash
   npm run dev
   # Ir a http://localhost:3000/auth/login
   # Crear cuenta con test@test.com
   # Debería redirigir a /dashboard
   ```

3. **Verificar Sidebar**:
   - Sin suscripción: Simulacros, Resultados, Grupo (bloqueados 🔒)
   - Items accesibles: Dashboard, Ranking, Material, Notificaciones

### Corto Plazo

1. **Completar página Perfil** (`app/dashboard/perfil/page.tsx`):
   - Editar perfil (nombre, colegio, grado, ciudad)
   - Cambiar contraseña (llamar a `trpc.auth.cambiarContrasena`)

2. **Crear páginas faltantes**:
   ```
   /dashboard/simulacro/  - Crear y realizar simulacros
   /dashboard/resultados/ - Ver historiales
   /dashboard/ranking/    - Ver rankings
   /dashboard/material/   - Documentos y videos (placeholder)
   /dashboard/grupo/      - Gestión de grupos (placeholder)
   /dashboard/notificaciones/ - Centro de notificaciones
   ```

3. **Hacer funcionales los botones**:
   - "Ver Planes" en Sidebar → link a `/dashboard/planes`
   - "Contratar Plan" en planes → integración de pagos (Stripe)
   - "Cambiar Contraseña" en perfil → lógica backend

### Arquitectura de Componentes

```
components/
├── shared/
│   ├── Sidebar.tsx ✅
│   ├── DashboardLayout.tsx ✅
│   └── ...
├── simulacro/        👈 crear
│   ├── SimulacroCard.tsx
│   ├── Pregunta.tsx
│   └── ResultadoModal.tsx
├── dashboard/        👈 crear
│   ├── StatsGrid.tsx
│   ├── GraficoCircular.tsx
│   └── ActividadReciente.tsx
└── planes/           👈 crear
    ├── PlaneCard.tsx
    └── FAQ.tsx
```

---

## 🔐 Sistema de Permisos en Acción

### En el Sidebar:
```tsx
// Sin suscripción:
- ver Simulacros ❌ (bloqueado)
- ver Resultados ❌ (bloqueado)
- ver Mi Grupo ❌ (bloqueado)

// Siempre accesible:
- Dashboard ✅
- Ranking ✅
- Material de Estudio ✅
- Notificaciones ✅
```

### En rutas:
```tsx
// Estas NECESITAN suscripción:
POST /trpc/simulacro.crear        → Error 403 sin plan
GET  /trpc/simulacro.obtenerHistorial

// Estas son GRATIS:
GET  /trpc/auth.obtenerPerfil
POST /trpc/auth.actualizarPerfil
GET  /trpc/suscripcion.obtenerEstado
```

---

## 📝 Checklist para Continuar

- [ ] Probar login/registro en `http://localhost:3000`
- [ ] Verificar que Sidebar muestra estado correcto
- [ ] Completar lógica de Perfil
- [ ] Crear páginas de simulacros
- [ ] Integrar Stripe para pagos
- [ ] Agregar Material de estudio
- [ ] Crear sistema de notificaciones

---

## 🚀 Para Empezar Ahora

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: En otra ventana (opcional monitoring)
npm run db:studio  # Ver datos en tiempo real
```

Luego abre: **http://localhost:3000**

Usa estas credenciales de ejemplo:
- Email: `test@test.com`
- Contraseña: `Test12345`

¿Quieres que continúe con las páginas de simulacros o algo específico?
