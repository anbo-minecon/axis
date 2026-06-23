# Setup del Backend - AXIS Pre-ICFES

## 1. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus valores:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/axis_preicfes"

# NextAuth (generar secret con: openssl rand -base64 32)
NEXTAUTH_SECRET="tu-secret-generado"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

## 2. Configurar Base de Datos PostgreSQL

### Opción A: Con Docker (Recomendado)

```bash
docker run --name axis-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=axis_preicfes -p 5432:5432 -d postgres:15
```

### Opción B: PostgreSQL Local

Asegúrate que PostgreSQL esté corriendo y crea una BD:

```bash
createdb axis_preicfes
```

## 3. Instalar Dependencias

```bash
npm install
```

## 4. Ejecutar Migraciones Prisma

### Primera vez (crear esquema):

```bash
npm run db:migrate
```

Da un nombre descriptivo, ej: `init_usuarios_suscripciones`

### Ambiente de producción:

```bash
npm run db:migrate:prod
```

## 5. Seed de Datos Iniciales

Esto crea los planes (Básico, Pro, Premium, Institucional) y áreas de estudio:

```bash
npm run db:seed
```

## 6. Verificar Base de Datos (Opcional)

```bash
npm run db:studio
```

Se abrirá una interfaz visual en http://localhost:5555

## 7. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Visita http://localhost:3000

## Rutas API Disponibles

```
POST   /api/trpc -> auth.registro             # Registrar estudiante
POST   /api/trpc -> auth.obtenerPerfil       # Obtener perfil (protegido)
POST   /api/trpc -> suscripcion.obtenerEstado  # Ver suscripción  
POST   /api/trpc -> admin.activarSuscripcion # Activar plan (ADMIN)
```

## Importante: Extensión TypeScript nextauth

El archivo `types/auth.ts` extiende los tipos de NextAuth. Asegúrate de que esté importado en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["next", "node"]
  }
}
```

## Troubleshooting

### Error: "relation "usuarios" does not exist"

La migración no se ejecutó. Corre:
```bash
npm run db:push
```

### Error: "Can't reach database server"

Verifica que:
1. PostgreSQL está corriendo
2. DATABASE_URL es correcto
3. Bases de datos existe

### Error: "Prisma client not generated"

```bash
npm run db:generate
```

## Comando Útiles

```bash
npm run db:push           # Push schema sin migraciones (dev)
npm run db:reset          # Reset completo-recrear schema (dev only)
npm run db:studio         # Abrir interfaz visual
npm run db:seed          # Ejecutar seed manualmente
```

## Estructura Backend

```
server/trpc/
├── router.ts             # Configure handlers (public/protected/subscribed)
├── context.ts            # Contexto de sesión y BD
├── index.ts              # Router principal que combina todo
└── routers/
    ├── auth.ts           # Registro, login, perfil
    ├── simulacro.ts      # Crear/obtener/finalizar simulacros (requiere suscripción)
    ├── suscripcion.ts    # Estado y verificación de suscripción
    └── admin.ts          # Gestión de planes y usuarios (solo ADMIN)

lib/
├── auth.ts               # Configuración NextAuth
├── db.ts                 # Prisma client
└── suscripcion-utils.ts  # Funciones auxiliares

prisma/
├── schema.prisma         # Modelos (Usuario, Plan, Suscripcion, etc)
└── seed.ts               # Datos iniciales
```

## Próximos Pasos

1. ✅ Backend autenticación y suscripciones
2. ⏳ Base de datos migraciones
3. ⏳ Frontend login/registro
4. ⏳ Panel admin para gestionar suscripciones
5. ⏳ Integración de pagos (Stripe)
