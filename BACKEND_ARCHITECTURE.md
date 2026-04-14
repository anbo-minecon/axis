# Arquitectura de Backend - Autenticación y Suscripciones

## Resumen

El sistema de autenticación y suscripciones de AXIS permite tres niveles de acceso:

1. **Sin Autenticación**: Acceso a landing page y registro
2. **Autenticado Sin Suscripción**: Acceso limitado a documentos, videos, ranking, notificaciones
3. **Autenticado Con Suscripción**: Acceso completo a simulacros, estadísticas, grupos, etc.

## Flujo de Autenticación

### Registro (POST /auth/registro)

**Entrada:**
```json
{
  "nombre": "Carlos Pérez",
  "email": "carlos@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "colegio": "IED Los Andes",
  "grado": 11,
  "ciudad": "Bogotá"
}
```

**Proceso:**
1. Validar email único
2. Hashear contraseña con bcryptjs (rounds: 12)
3. Crear Usuario sin suscripción (rol: ESTUDIANTE)
4. Retornar userId para login

**Salida:**
```json
{
  "success": true,
  "userId": "cuid_xyz",
  "email": "carlos@example.com",
  "nombre": "Carlos Pérez",
  "message": "Registro exitoso. Ahora puedes iniciar sesión"
}
```

### Login (POST /auth/login - NextAuth)

**Providers:**
- **Credentials**: Email + contraseña hasheada
- **Google OAuth**: Signup automático si no existe

**Flujo Credentials:**
1. Validar email existe
2. Comparar contraseña con bcryptjs
3. Generar JWT session
4. Incluir `tieneSubscripcion` en token

**JWT Payload:**
```json
{
  "id": "usuario_cuid",
  "email": "carlos@example.com",
  "name": "Carlos Pérez",
  "tieneSubscripcion": false
}
```

### Obtener Perfil (GET /auth/obtenerPerfil)

Retorna información del usuario autenticado incluyendo estado de suscripción.

**Respuesta:**
```json
{
  "id": "cuid_xyz",
  "nombre": "Carlos Pérez",
  "email": "carlos@example.com",
  "rol": "ESTUDIANTE",
  "colegio": "IED Los Andes",
  "grado": 11,
  "tieneSubscripcion": true,
  "suscripcion": {
    "id": "sub_cuid",
    "planNombre": "Pro",
    "fechaInicio": "2026-04-08",
    "fechaFin": "2026-07-08",
    "activa": true,
    "diasRestantes": 90
  }
}
```

## Sistema de Suscripciones

### Middleware de Verificación

Dos middlewares protegen procedimientos:

1. **protectedProcedure**: Solo requiere autenticación
2. **subscribedProcedure**: Requiere autenticación + suscripción activa

### Estados de Suscripción

```
Usuario Sin Suscripción
├─ Acceso: Perfil, Documentos, Videos, Ranking, Notificaciones
└─ Bloqueado: Simulacros, Estadísticas, Grupos, Competencia

Usuario Con Suscripción Activa (fechaFin > now())
├─ Acceso: TODO el sistema
└─ Beneficios: Simulacros ilimitados, grupos, estadísticas

Usuario Con Suscripción Expirada (fechaFin < now())
└─ Revierte a estado sin suscripción automáticamente
```

### Activar Suscripción (ADMIN)

**POST /admin/activarSuscripcion**

```json
{
  "usuarioId": "cuid_xyz",
  "planId": "plan_pro",
  "duracionDias": 90  // opcional, usa plan.duracionDias si omite
}
```

**Proceso:**
1. Verificar usuario es ADMIN
2. Verificar usuario existe
3. Crear/Reemplazar Suscripcion
4. Actualizar Usuario.planId
5. Setear fechaFin = ahora + duracionDias

**Respuesta:**
```json
{
  "success": true,
  "suscripcion": {
    "id": "sub_cuid",
    "usuarioId": "cuid_xyz",
    "plan": "Pro",
    "fechaFin": "2026-07-08",
    "activa": true
  }
}
```

## Modelos Prisma

### Usuario
```prisma
model Usuario {
  id            String    @id @default(cuid())
  nombre        String
  email         String    @unique
  passwordHash  String?        // null si usa OAuth
  rol           Rol       @default(ESTUDIANTE)  // ESTUDIANTE, DOCENTE, ADMIN
  planId        String?   // referencia rápida (redundante)
  suscripcion   Suscripcion?
  // ... otros campos
}
```

### Suscripcion
```prisma
model Suscripcion {
  id        String   @id @default(cuid())
  usuarioId String   @unique  // 1 a 1
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  planId    String
  plan      Plan     @relation(fields: [planId], references: [id])
  fechaInicio DateTime @default(now())
  fechaFin  DateTime          // Cuando expira la suscripción
  activa    Boolean  @default(true)
}
```

### Plan
```prisma
model Plan {
  id               String  @id @default(cuid())
  nombre           String  @unique  // "Básico", "Pro", "Institucional"
  precio           Float
  duracionDias     Int     // Duración estándar de la suscripción
  simulacrosMax    Int     @default(-1)  // -1 = ilimitados
  caracteristicas  String[]
  activo           Boolean @default(true)
  suscripciones    Suscripcion[]
}
```

## Rutas tRPC Disponibles

### Autenticación (`auth.*`)
- `auth.registro` (PUBLIC)
- `auth.obtenerPerfil` (PROTECTED)
- `auth.actualizarPerfil` (PROTECTED)
- `auth.cambiarContrasena` (PROTECTED)
- `auth.verificarAccesoSimulacros` (PROTECTED)

### Suscripciones (`suscripcion.*`)
- `suscripcion.obtenerEstado` (PROTECTED)
- `suscripcion.verificarAcceso` (PROTECTED) - verifica acceso a función específica
- `suscripcion.obtenerPlanes` (PROTECTED)

### Simulacros (`simulacro.*`) - REQUIEREN SUSCRIPCIÓN
- `simulacro.crear` (SUBSCRIBED)
- `simulacro.obtener` (SUBSCRIBED)
- `simulacro.finalizar` (SUBSCRIBED)
- `simulacro.obtenerHistorial` (SUBSCRIBED)

### Admin (`admin.*`) - REQUIEREN ROL ADMIN
- `admin.activarSuscripcion`
- `admin.desactivarSuscripcion`
- `admin.obtenerSuscripcion`
- `admin.listarPlanes`
- `admin.crearPlan`
- `admin.actualizarPlan`
- `admin.listarUsuarios`

## Validaciones de Seguridad

### Nivel BD
- Email único
- passwordHash requerido para Credentials Provider
- Suscripcion.usuarioId unique (1 a 1)
- Validación de fechaFin en suscripciones

### Nivel API
- Validación Zod de entradas
- Verificación de rol ADMIN en endpoints admin
- Comparación bcryptjs de contraseñas
- JWT refresh automático de estado de suscripción

### Funcionalidades Bloqueadas Sin Suscripción

Estos endpoints retornan error 403 FORBIDDEN si no tiene suscripción:

```
POST   /trpc/simulacro.crear
GET    /trpc/simulacro.obtener
POST   /trpc/simulacro.finalizar
GET    /trpc/simulacro.obtenerHistorial
```

## Proximos Pasos

1. **Migraciones Prisma**: `npx prisma migrate dev --name init`
2. **Seed de Planes**: Crear planes básicos (Básico, Pro, Premium)
3. **Frontend de Autenticación**: Componentes de login/registro
4. **Panel Admin**: CRUD de suscripciones y planes
5. **Integración de Pagos**: Stripe/PayPal para compra de planes
