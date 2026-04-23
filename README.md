# 🎓 Axis Pre-ICFES

Plataforma integral de preparación para las Pruebas de Estado ICFES en Colombia, diseñada con tecnología moderna y arquitectura escalable.

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Estilos**: Tailwind CSS + tailwindcss-animate
- **Componentes**: shadcn/ui + Radix UI
- **Iconos**: Lucide React
- **State Management**: React Hooks + TanStack Query
- **Fuentes**: Syne + DM Sans (Google Fonts)

### Backend
- **API**: tRPC (full-stack type-safe)
- **Base de datos**: PostgreSQL
- **ORM**: Prisma v5
- **Validación**: Zod
- **Autenticación**: Auth.js (NextAuth v5 beta)
- **Password hashing**: bcryptjs
- **Serialización**: SuperJSON

### DevOps & Herramientas
- **Node.js**: v18+
- **Package Manager**: npm
- **Linter**: ESLint (Next.js config)
- **PostCSS**: Procesamiento de CSS
- **Environment**: Variables de entorno seguras

---

## 📁 Estructura del Proyecto

### **🗂️ Estructura General**
```
axis-preicfes/
├── � Archivos de configuración
│   ├── .env, .env.example              # Variables de entorno
│   ├── .gitignore                      # Archivos ignorados por git
│   ├── package.json, package-lock.json # Dependencias y scripts
│   ├── next.config.js                  # Configuración Next.js
│   ├── tsconfig.json                   # Configuración TypeScript
│   ├── tailwind.config.ts              # Configuración Tailwind CSS
│   ├── postcss.config.js               # Configuración PostCSS
│   └── next-env.d.ts                   # Tipos Next.js
│
├── 📂 app/                    # Next.js App Router
│   ├── page.tsx              # Landing page (redirect)
│   ├── layout.tsx            # Root layout global
│   ├── globals.css           # Estilos globales
│   ├── landing/              # Página principal pública
│   ├── auth/                 # Login y registro
│   ├── dashboard/            # Área estudiantil protegida
│   ├── admin/                # Panel administración
│   ├── developer/            # Rol técnico oculto �
│   └── api/                  # Endpoints API
│
├── 📂 components/            # Componentes React
│   ├── landing/              # Componentes página principal (13 archivos)
│   ├── shared/               # Componentes reutilizables (6 archivos)
│   ├── dashboard/            # Componentes dashboard (5 archivos)
│   ├── simulacro/            # Componentes de exámenes (README only)
│   ├── ui/                   # Componentes base shadcn/ui (🔴 vacía)
│   ├── icons/                # Iconos personalizados
│   └── developer/            # Componentes rol Developer
│
├── 📂 lib/                   # Utilidades y configuración
│   ├── auth.ts               # Configuración Auth.js
│   ├── db.ts                 # Cliente Prisma
│   ├── utils.ts              # Funciones auxiliares
│   └── (otros archivos de configuración)
│
├── 📂 hooks/                 # React Hooks personalizados
│   ├── useTheme.ts           # Manejo de temas
│   └── useUser.ts            # Datos de usuario
│
├── 📂 server/                # Backend tRPC
│   └── trpc/                 # Configuración API type-safe
│       ├── context.ts        # Contexto de requests
│       ├── router.ts         # Router principal
│       └── routers/          # Sub-routers especializados
│
├── 📂 prisma/                # Base de datos
│   ├── schema.prisma         # Modelo de datos completo
│   └── migrations/           # Historial de cambios
│
├── 📂 types/                 # Tipos TypeScript
│   └── (definiciones globales)
│
├── 📂 public/                # Archivos estáticos
│   ├── images/               # Imágenes y logos (3 archivos)
│   └── scripts/              # Scripts cliente (1 archivo)
│
├── 📂 styles/                # Estilos adicionales (🔴 vacía)
├── 📂 store/                 # Estado global (🔴 vacía)
├── 📂 scripts/               # Scripts de desarrollo
├── 📂 node_modules/          # Dependencias instaladas
├── 📂 .next/                 # Build de Next.js
└── 📄 README.md              # Documentación del proyecto
```

### **🚫 Carpetas Vacías (Preparadas para Futuro)**
| Carpeta | Estado | Uso Planeado |
|---------|--------|--------------|
| `styles/` | **🔴 Vacía** | Estilos CSS adicionales personalizados |
| `store/` | **🔴 Vacía** | Estado global (Redux/Zustand) si se requiere |
| `components/ui/` | **🔴 Vacía** | Componentes base shadcn/ui (botones, inputs, dialogs) |

### **📊 Distribución de Archivos**
| Categoría | Carpetas | Con Contenido | Vacías |
|-----------|----------|---------------|--------|
| **Principales** | 12 | 9 | 3 |
| **Components** | 6 | 5 | 1 |
| **Total general** | 18+ | 14+ | 4+ |

**Porcentaje de desarrollo:** ~75% completado

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
| `/developer/login` | Login del Developer | ✅ |
| `/developer/dashboard` | Dashboard técnico (rol oculto) | ✅ |

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

#### Developer (`components/developer/`) 🔐
- `DeveloperLogin.tsx` - Formulario de autenticación
- `DeveloperDashboard.tsx` - Dashboard técnico

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
| `developer-auth.ts` | Autenticación del rol Developer (encriptado) |
| `developer-guard.ts` | Middleware de protección para Developer |
| `developer-protection.ts` | Funciones de ocultamiento del rol Developer |

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

#### `routers/admin.ts` (Actualizado)
Procedimientos con protecciones:
- `listarUsuarios` - Lista usuarios (sin incluir DEVELOPER)
- `obtenerUsuario` - Detalles de usuario (protegido)
- `crearUsuario` - Crear usuario con validación de rol
- `actualizarUsuario` - Editar usuario (no permite rol DEVELOPER)
- `eliminarUsuario` - Eliminar usuario (protegido)
- Otros: planes, suscripciones, etc.

---

### 💾 **prisma/** - Base de Datos

#### `schema.prisma`
Define los modelos:
- `Usuario` - Estudiantes registrados (incluye rol DEVELOPER oculto)
- `Suscripcion` - Planes de los usuarios
- `Plan` - Tipos de planes disponibles
- `Area` - Áreas del ICFES (Lectura, Matemáticas, etc.)
- `Pregunta` - Banco de preguntas
- `OpcionRespuesta` - Opciones A, B, C, D
- `Simulacro` - Exámenes
- `RespuestaUsuario` - Respuestas del estudiante
- `DeveloperCredential` - Credenciales del rol Developer (encriptadas)
- `AuditLog` - Registro de acciones administrativas
- `SystemLog` - Eventos internos del sistema
- `BackupLog` - Historial de respaldos
- `IntegrationLog` - Estado de integraciones externas

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

# Rol Developer (Setup)
npx tsx scripts/setup-developer.ts  # Crear usuario Developer con credenciales

# Linting
npm run lint             # Ejecuta ESLint
```

---

## 🔧 Configuración Inicial

### 1️⃣ **Prerrequisitos**
- Node.js v18+ 
- PostgreSQL instalado y corriendo
- Git

### 2️⃣ **Instalar dependencias**
```bash
npm install
```

### 3️⃣ **Configurar variables de entorno**
```bash
# Copiar template
cp .env.example .env

# Editar .env con tus valores:
# - DATABASE_URL (PostgreSQL)
# - AUTH_SECRET (NextAuth v5)
# - AUTH_URL
```

**Ejemplo .env:**
```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/axis_preicfes"

# Auth.js (NextAuth v5)
AUTH_SECRET="genera-un-secret-seguro-con-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Axis Pre-ICFES"
```

### 4️⃣ **Preparar Base de Datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push
```

### 5️⃣ **Iniciar servidor**
```bash
npm run dev
```

Accede a: **[http://localhost:3000](http://localhost:3000)**

> **Nota:** Si el puerto 3000 está ocupado, Next.js automáticamente usará el 3001

---

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/dbname` |
| `AUTH_SECRET` | Secret para Auth.js (NextAuth v5) | `openssl rand -base64 32` |
| `AUTH_URL` | URL base de la app | `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID (opcional) | `tu-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret (opcional) | `tu-google-secret` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la aplicación | `Axis Pre-ICFES` |
| `REDIS_URL` | Conexión a Redis (opcional caché) | `redis://localhost:6379` |

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
- **[INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)** - Índice de documentación 🔐
- **[DEVELOPER_QUICKSTART.md](DEVELOPER_QUICKSTART.md)** - Setup rápido rol Developer 🔐
- **[DEVELOPER_ROLE.md](DEVELOPER_ROLE.md)** - Guía completa rol Developer 🔐
- **[DEVELOPER_IMPLEMENTATION.md](DEVELOPER_IMPLEMENTATION.md)** - Detalles técnicos Developer 🔐
- **[README_DEVELOPER_ROLE.md](README_DEVELOPER_ROLE.md)** - Resumen ejecutivo Developer 🔐
- **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Checklist de verificación 🔐

---

## ✅ Status del Proyecto

| Feature | Estado | Detalles |
|---------|--------|----------|
| **Configuración Base** | ✅ Completado | Dependencias, entorno, base de datos |
| **Landing Page** | ✅ Completada | Diseño responsive, secciones completas |
| **Autenticación** | ✅ Funcional | Login, registro, Auth.js v5 |
| **Dashboard Estudiantil** | ✅ Funcional | Interfaz principal, navegación |
| **Base de Datos** | ✅ Conectada | PostgreSQL + Prisma ORM |
| **Sistema de Notificaciones** | ✅ Implementado | Toast notifications |
| **Componentes UI** | ✅ Completados | shadcn/ui + componentes personalizados |
| **Tipado TypeScript** | ✅ Completo | Strict mode, tipos globales |
| **API tRPC** | ✅ Funcional | Routers de auth y simulacros |
| **Banco de Preguntas** | 🔄 En desarrollo | Modelo de datos listo |
| **Simulacros Interactivos** | 🔄 En desarrollo | Interfaz y lógica pendiente |
| **Panel Administrativo** | 🔄 En desarrollo | Gestión de contenido |
| **Estadísticas Avanzadas** | 🔄 En desarrollo | Reportes y análisis |
| **Sistema de Pagos** | ⏳ Pendiente | Integración con pasarelas |
| **Móvil (PWA)** | ⏳ Pendiente | Versión móvil optimizada |

### 🎯 **Próximos Hitos**
- [ ] Implementar motor de simulacros con temporizador
- [ ] Cargar banco de preguntas inicial
- [ ] Desarrollar panel de administración
- [ ] Agregar estadísticas detalladas
- [ ] Implementar sistema de suscripciones

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

---

## 🔐 Rol Developer (Nuevo)

### Características Principales

**Rol especializado de supervisión técnica** implementado con las siguientes características:

- ✅ **Visibilidad Restringida**: No aparece en interfaces públicas
- ✅ **Autenticación Independiente**: Login en `/developer/login`
- ✅ **Dashboard Técnico**: Monitoreo en tiempo real del sistema
- ✅ **Auditoría Completa**: Registro de todas las acciones administrativas
- ✅ **Gestión de Respaldos**: Crear y verificar backups
- ✅ **Monitoreo de Integraciones**: Estado de servicios externos

### Acceso Rápido

```bash
# 1. Crear usuario Developer
npx tsx scripts/setup-developer.ts

# 2. Acceder a
http://localhost:3000/developer/login

# Credenciales por defecto
# Email: developer@axis-preicfes.local
# Password: Developer@2025#Secure
```

### Documentación

Para información completa sobre el rol Developer, consulta:
- [DEVELOPER_QUICKSTART.md](DEVELOPER_QUICKSTART.md) - Inicio rápido (3 min)
- [DEVELOPER_ROLE.md](DEVELOPER_ROLE.md) - Guía completa (15 min)
- [INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md) - Navegación de documentos

### APIs Disponibles

```
POST   /api/developer/login              - Autenticación
GET    /api/developer/dashboard          - Resumen del sistema
GET    /api/developer/audit-logs         - Auditoría administrativas
GET    /api/developer/system-logs        - Logs del sistema
GET    /api/developer/backups            - Histórico de respaldos
POST   /api/developer/backups            - Crear respaldo
GET    /api/developer/integrations       - Estado de integraciones
```

---

## 🐛 **Solución de Problemas Comunes**

### Error: `Cannot find module 'tailwindcss-animate'`
```bash
# Solución:
npm install tailwindcss-animate
npm run dev
```

### Error: Puerto 3000 ocupado
Next.js automáticamente usará el puerto 3001. Accede a `http://localhost:3001`

### Error: Base de datos no conectada
```bash
# Verificar conexión:
npm run db:generate
npm run db:push
# Asegúrate de que PostgreSQL esté corriendo
```

### Error: `AUTH_SECRET` faltante
```bash
# Generar secret seguro:
openssl rand -base64 32
# Agregarlo a tu archivo .env
```

## 📞 **Soporte**

- **Documentación técnica**: Revisa los archivos `.md` en la raíz
- **Issues**: Reporta problemas en el repositorio del proyecto
- **Contacto del equipo**: Disponible en la documentación interna

---

**Última actualización:** Abril 15, 2026  
**Versión:** v0.1.0  
**Estado:** Desarrollo activo 🚀
