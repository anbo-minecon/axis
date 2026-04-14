# 🎓 Axis Pre-ICFES

Plataforma de preparación para las Pruebas de Estado ICFES en Colombia.

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui + Radix UI
- **Iconos**: Lucide React
- **State Management**: React Hooks + TanStack Query

### Backend
- **API**: tRPC (full-stack type-safe)
- **Base de datos**: PostgreSQL
- **ORM**: Prisma v5
- **Validación**: Zod
- **Autenticación**: Auth.js (NextAuth v5)
- **Password hashing**: bcryptjs

### DevOps
- **Node.js**: v18+
- **Package Manager**: npm
- **Linter**: ESLint (Next.js)

---

## 📁 Estructura del Proyecto

```
axis-preicfes/
│
├── 📂 app/                           # Next.js App Router
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout global
│   ├── globals.css                   # Estilos globales
│   │
│   ├── 📂 landing/                   # Página pública de inicio
│   │   └── page.tsx
│   │
│   ├── 📂 auth/                      # Autenticación
│   │   ├── layout.tsx                # Layout para auth pages
│   │   ├── 📂 login/
│   │   │   └── page.tsx              # Formulario de login
│   │   └── 📂 registro/
│   │       └── page.tsx              # Formulario de registro
│   │
│   ├── 📂 dashboard/                 # Área protegida del estudiante
│   │   ├── layout.tsx                # Sidebar navegación
│   │   ├── page.tsx                  # Dashboard principal
│   │   ├── 📂 estadisticas/
│   │   │   └── page.tsx              # Estadísticas del estudiante
│   │   ├── 📂 perfil/
│   │   │   └── page.tsx              # Configuración de perfil
│   │   ├── 📂 resultados/
│   │   │   └── 📂 [id]/
│   │   │       └── page.tsx          # Detalle de resultados
│   │   └── 📂 simulacro/
│   │       └── 📂 [id]/
│   │           └── page.tsx          # Interfaz de examen
│   │
│   ├── 📂 admin/                     # Panel de administración
│   │   ├── 📂 planes/
│   │   │   └── page.tsx              # Gestión de planes
│   │   ├── 📂 preguntas/
│   │   │   └── page.tsx              # Banco de preguntas
│   │   └── 📂 usuarios/
│   │       └── page.tsx              # Gestión de usuarios
│   │
│   └── 📂 api/                       # API routes
│       ├── 📂 auth/
│       │   └── 📂 nextauth/
│       │       └── [...nextauth].ts  # Configuración NextAuth
│       └── 📂 trpc/
│           └── 📂 trpc/
│               └── [trpc].ts         # Endpoint tRPC
│
├── 📂 components/                    # Componentes React reutilizables
│   ├── 📂 landing/                   # Componentes de la landing
│   │   ├── HeroSection.tsx           # Sección hero
│   │   ├── Navigation.tsx            # Barra de navegación
│   │   ├── AreasICFES.tsx            # Áreas del examen
│   │   ├── Caracteristicas.tsx       # Características principales
│   │   ├── EducationalResources.tsx  # Recursos educativos
│   │   ├── HowItWorks.tsx            # Cómo funciona
│   │   ├── ImpactStats.tsx           # Estadísticas de impacto
│   │   ├── PricingPlans.tsx          # Planes de precios
│   │   ├── Testimonials.tsx          # Testimonios
│   │   ├── WhyAXIS.tsx               # Por qué AXIS
│   │   ├── FAQ.tsx                   # Preguntas frecuentes
│   │   ├── FinalCTA.tsx              # Llamado a acción final
│   │   └── Footer.tsx                # Pie de página
│   │
│   ├── 📂 dashboard/                 # Componentes del dashboard
│   │   └── README.md
│   │
│   ├── 📂 simulacro/                 # Componentes del examen
│   │   └── README.md
│   │
│   ├── 📂 shared/                    # Componentes compartidos
│   │   ├── ToastContainer.tsx        # Sistema de notificaciones
│   │   └── README.md
│   │
│   ├── 📂 ui/                        # Componentes básicos de UI
│   │   └── (botones, inputs, etc.)
│   │
│   └── 📂 icons/                     # Iconos personalizados
│       ├── AreaIcon.tsx
│       ├── FeatureIcons.tsx
│       ├── index.tsx
│       └── README.md
│
├── 📂 lib/                           # Funciones utilitarias
│   ├── auth.ts                       # Configuración NextAuth
│   ├── auth-guard.ts                 # Middleware de autenticación
│   ├── db.ts                         # Cliente de Prisma
│   ├── notifications.ts              # Sistema de toasts
│   ├── utils.ts                      # Funciones auxiliares
│   └── trpc-client.ts                # Cliente tRPC (frontend)
│
├── 📂 hooks/                         # Hooks React personalizados
│   └── useUser.ts                    # Hook para datos del usuario
│
├── 📂 server/                        # Código del backend
│   └── 📂 trpc/
│       ├── context.ts                # Contexto de tRPC (sesión, BD)
│       ├── router.ts                 # Router principal tRPC
│       └── 📂 routers/               # Sub-routers de tRPC
│           ├── auth.ts               # Procedimientos: registro, login, perfil
│           └── simulacro.ts          # Procedimientos: exámenes, respuestas
│
├── 📂 types/                         # Tipos TypeScript
│   ├── index.ts                      # Tipos principales
│   └── auth.ts                       # Tipos de autenticación
│
├── 📂 prisma/                        # Base de datos
│   ├── schema.prisma                 # Definición de tablas y relaciones
│   └── 📂 migrations/                # Histórico de cambios de BD
│
├── 📂 styles/                        # Estilos (si es necesario)
│
├── 📂 store/                         # Almacenamiento de estado global (optional)
│
├── 📂 public/                        # Archivos estáticos
│   └── 📂 images/
│
├── 📂 node_modules/                  # Dependencias instaladas
│
├── .env                              # Variables de entorno (gitignored)
├── .env.local                        # Configuración local
├── .env.example                      # Template de .env
├── .gitignore                        # Archivos ignorados por git
│
├── next.config.js                    # Configuración de Next.js
├── tsconfig.json                     # Configuración TypeScript
├── tailwind.config.ts                # Configuración Tailwind CSS
├── postcss.config.js                 # Configuración PostCSS
│
├── package.json                      # Dependencias y scripts
├── package-lock.json                 # Lock de versiones
│
├── README.md                         # Este archivo
├── BACKEND_SETUP.md                  # Guía de configuración backend
├── BACKEND_ARCHITECTURE.md           # Arquitectura detallada backend
├── FRONTEND_GUIDE.md                 # Guía frontend
├── DIAGNOSTICO_CONEXION.md           # Diagnóstico de conexiones
├── GUIA_RAPIDA_REGISTRO.md           # Guía rápida de registro
│
└── 🔧 Scripts de desarrollo
    ├── verify-connection.js          # Verificar conexión del sistema
    └── test-db-connection.js         # Test de conexión a BD
```

---

## 🎯 Descripción de Módulos Principales

### 📄 **app/** - Páginas (Next.js App Router)

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Landing page pública | ✅ |
| `/auth/login` | Página de login | ✅ |
| `/auth/registro` | Página de registro | ✅ |
| `/dashboard` | Dashboard del estudiante | ✅ |
| `/dashboard/estadisticas` | Estadísticas personales | 🔄 |
| `/dashboard/perfil` | Configuración de perfil | 🔄 |
| `/dashboard/resultados/[id]` | Detalle de resultados | 🔄 |
| `/dashboard/simulacro/[id]` | Interfaz del examen | 🔄 |
| `/admin/planes` | Gestión de planes | 🔄 |
| `/admin/preguntas` | Banco de preguntas | 🔄 |
| `/admin/usuarios` | Gestión de usuarios | 🔄 |

---

### 🧩 **components/** - Componentes React

#### Landing (`components/landing/`)
- `HeroSection.tsx` - Sección principal con CTA
- `Navigation.tsx` - Menú de navegación
- `AreasICFES.tsx` - Áreas temáticas del ICFES
- `Caracteristicas.tsx` - Ventajas de la plataforma
- `EducationalResources.tsx` - Recursos disponibles
- `HowItWorks.tsx` - Guía de funcionamiento
- `ImpactStats.tsx` - Estadísticas de impacto
- `PricingPlans.tsx` - Planes y precios
- `Testimonials.tsx` - Testimonios de usuarios
- `WhyAXIS.tsx` - Diferenciales del producto
- `FAQ.tsx` - Preguntas frecuentes
- `FinalCTA.tsx` - Llamado a acción final
- `Footer.tsx` - Pie de página

#### Compartidos (`components/shared/`)
- `ToastContainer.tsx` - Sistema de notificaciones tipo toast
- Componentes reutilizables en toda la app

#### Iconos (`components/icons/`)
- `AreaIcon.tsx` - Iconos de áreas temáticas
- `FeatureIcons.tsx` - Iconos de características
- Íconos personalizados

#### UI (`components/ui/`)
- Componentes base de shadcn/ui (botones, inputs, dialogs, etc.)

---

### 🔐 **lib/** - Utilities y Configuración

| Archivo | Propósito |
|---------|-----------|
| `auth.ts` | Configuración de NextAuth, proveedores |
| `auth-guard.ts` | Middleware para rutas protegidas |
| `db.ts` | Cliente de Prisma singleton |
| `notifications.ts` | Sistema de toast notifications |
| `utils.ts` | Funciones auxiliares de uso general |
| `trpc-client.ts` | Cliente tRPC configurado para el frontend |

---

### ⚙️ **server/trpc/** - Backend API

#### `context.ts`
- Crea el contexto de cada request
- Incluye sesión del usuario y cliente Prisma
- Disponible en todos los routers

#### `router.ts`
- Router principal que combina sub-routers
- Define el punto de entrada de la API

#### `routers/auth.ts`
Procedimientos disponibles:
- `registro` - Crear nueva cuenta
- `login` - Autencer usuario (deprecado, usa NextAuth)
- `obtenerPerfil` - Obtener datos del usuario
- `actualizarPerfil` - Editar perfil del usuario

#### `routers/simulacro.ts`
Procedimientos disponibles:
- `listar` - Obtener simulacros disponibles
- `obtenerDetalles` - Datos de un simulacro
- `guardarRespuesta` - Almacenar respuesta del usuario
- `obtenerResultados` - Ver resultados del examen

---

### 💾 **prisma/** - Base de Datos

#### `schema.prisma`
Define los modelos:
- `Usuario` - Estudiantes registrados
- `Suscripcion` - Planes de los usuarios
- `Plan` - Tipos de planes disponibles
- `Area` - Áreas del ICFES (Lectura, Matemáticas, etc.)
- `Pregunta` - Banco de preguntas
- `OpcionRespuesta` - Opciones A, B, C, D
- `Simulacro` - Exámenes
- `RespuestaUsuario` - Respuestas del estudiante

#### Migraciones (`migrations/`)
- Histórico de cambios en el esquema de BD

---

### 🎣 **hooks/** - React Hooks

#### `useUser.ts`
- `useUser()` - Obtiene datos del usuario autenticado
- `useSuscripcion()` - Obtiene plan de suscripción
- `useAcceso()` - Verifica si tiene acceso a un contenido

---

### 📌 **types/** - Tipos TypeScript

| Archivo | Propósito |
|---------|-----------|
| `index.ts` | Tipos globales del proyecto |
| `auth.ts` | Tipos relacionados a autenticación |

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (localhost:3000)

# Producción
npm run build            # Compila el proyecto
npm run start            # Inicia servidor de producción

# Base de datos
npm run db:generate      # Genera cliente de Prisma
npm run db:push          # Sincroniza schema con BD
npm run db:migrate       # Crea migración de cambios
npm run db:migrate:prod  # Aplica migraciones en producción
npm run db:studio        # Abre interfaz gráfica de Prisma
npm run db:reset         # Resetea toda la BD (solo dev)
npm run db:seed          # Ejecuta seeders (si existen)

# Linting
npm run lint             # Ejecuta ESLint
```

---

## 🔧 Configuración Inicial

### 1️⃣ **Instalar dependencias**
```bash
npm install
```

### 2️⃣ **Configurar variables de entorno**
```bash
# Copiar template
cp .env.example .env.local

# Editar .env.local con tus valores:
# - DATABASE_URL (PostgreSQL)
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

**Ejemplo .env.local:**
```env
DATABASE_URL="postgresql://postgres:anbo2019@localhost:5432/axis_preicfes"
NEXTAUTH_SECRET="tu-secret-muy-seguro-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 3️⃣ **Preparar Base de Datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Sincronizar tablas
npm run db:push
```

### 4️⃣ **Iniciar servidor**
```bash
npm run dev
```

Accede a: **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/dbname` |
| `NEXTAUTH_SECRET` | Secret para JWT (NextAuth) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base de la app | `http://localhost:3000` |

---

## 📊 Flujo de Autenticación

```
1. Usuario → Formulario Registro
2. → tRPC: auth.registro
3. → Backend: Validar + Hash password
4. → Prisma: Guardar en BD
5. → NextAuth: Crear sesión
6. → Frontend: Redirigir a Dashboard
```

---

## 📚 Archivos de Documentación Adicional

- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Configuración detallada del backend
- **[BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)** - Arquitectura de la API tRPC
- **[FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)** - Guía de componentes frontend
- **[DIAGNOSTICO_CONEXION.md](DIAGNOSTICO_CONEXION.md)** - Solución de problemas de conexión
- **[GUIA_RAPIDA_REGISTRO.md](GUIA_RAPIDA_REGISTRO.md)** - Tutorial rápido de registro

---

## ✅ Status del Proyecto

| Feature | Estado |
|---------|--------|
| Landing page | ✅ Completada |
| Autenticación (Login/Registro) | ✅ Funcional |
| Dashboard básico | ✅ Funcional |
| Base de datos | ✅ Conectada |
| Sistema de notificaciones | ✅ Implementado |
| Banco de preguntas | 🔄 En desarrollo |
| Simulacros | 🔄 En desarrollo |
| Panel Admin | 🔄 En desarrollo |
| Sistema de pagos | ⏳ Pendiente |
| Reportes | ⏳ Pendiente |

---

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/nueva-funcionalidad`
2. Commit: `git commit -m "Agregar nueva funcionalidad"`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Pull Request

---

## 📝 Licencia

Privado - AXIS Pre-ICFES © 2026

---

## 👨‍💻 Autor

Equipo AXIS Pre-ICFES

**Última actualización:** Abril 11, 2026
