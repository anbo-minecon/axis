# 🔍 DIAGNÓSTICO: CONEXIÓN FRONTEND ↔ BACKEND ↔ BASE DE DATOS

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
│  app/auth/registro/page.tsx                                     │
│  - Captura datos del formulario                                │
│  - Valida en cliente                                           │
│  - Llama tRPC: trpc.auth.registro.mutate({...})               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT tRPC                                   │
│  lib/trpc-client.ts                                            │
│  - createTRPCClient()                                          │
│  - httpBatchLink("http://localhost:3000/api/trpc")            │
│  - Envía credenciales: include                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST /api/trpc/[trpc]
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTE                            │
│  app/api/trpc/[trpc]/route.ts                                 │
│  - Recibe petición tRPC                                       │
│  - Enruta al router correcto                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER tRPC                                   │
│  server/trpc/routers/auth.ts                                   │
│  - Procedimiento: registro                                     │
│  - Receives: { ctx, input }                                   │
│  - ctx.db = PrismaClient                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM                                    │
│  lib/db.ts                                                     │
│  - const db = new PrismaClient()                              │
│  - Genera queries SQL automáticamente                         │
│  - CONNECTION: DATABASE_URL de .env.local                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL                                    │
│  postgresql://postgres:postgres@localhost:5432/axis_preicfes   │
│  - Host: localhost                                             │
│  - Port: 5432                                                  │
│  - Database: axis_preicfes                                     │
│  - User: postgres                                              │
│  - Password: postgres                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔗 Flujo Detallado: Registro de Usuario

### 1️⃣ **Frontend (app/auth/registro/page.tsx)**
```javascript
const result = await trpc.auth.registro.mutate({
  nombre: "Juan Pérez",
  email: "juan@test.com",
  password: "Password123",
  confirmPassword: "Password123",
  ciudad: "Bogotá"
});
```

### 2️⃣ **Cliente tRPC (lib/trpc-client.ts)**
- Intercepta la llamada
- Agrega credenciales: `credentials: "include"`
- Envía POST a `/api/trpc`
- Espera respuesta

### 3️⃣ **Servidor tRPC (server/trpc/routers/auth.ts)**
```javascript
registro: publicProcedure
  .input(registroSchema)
  .mutation(async ({ ctx, input }) => {
    // ctx.db = PrismaClient conectado a PostgreSQL
    
    // Verifica si email existe
    await ctx.db.usuario.findUnique({ 
      where: { email: input.email } 
    });
    
    // Hash contraseña
    const passwordHash = await hash(input.password, 12);
    
    // Crea usuario en BD
    const usuario = await ctx.db.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        passwordHash,
        ciudad: input.ciudad
      }
    });
    
    // Retorna resultado
    return { success: true, userId: usuario.id };
  });
```

### 4️⃣ **Prisma genera SQL**
```sql
SELECT * FROM "Usuario" WHERE "email" = 'juan@test.com';

INSERT INTO "Usuario" 
  ("id", "nombre", "email", "passwordHash", "ciudad", ...) 
VALUES 
  ('uuid-123', 'Juan Pérez', 'juan@test.com', '$2a$12...', 'Bogotá', ...);
```

### 5️⃣ **PostGRES ejecuta query**
- Inserta registro en tabla `Usuario`
- Retorna OK o ERROR

### 6️⃣ **Respuesta al frontend**
```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "juan@test.com",
  "nombre": "Juan Pérez",
  "message": "Registro exitoso"
}
```

## ⚠️ Posibles Problemas

### Problema #1: Base de datos no existe
**Error esperado:** Connection refused o authentication failed

**Solución:**
```bash
# Crear BD desde psql
createdb axis_preicfes

# O ejecutar migraciones
npm run db:push
```

### Problema #2: Tablas no existen
**Error esperado:** Relation "Usuario" does not exist

**Solución:**
```bash
# Ejecutar migraciones
npm run db:push

# O resetear todo (CUIDADO: borra datos)
npm run db:reset
```

### Problema #3: Variables de entorno no cargadas
**Error esperado:** DATABASE_URL is required

**Verificación:**
- ✅ Debe existir archivo `.env.local`
- ✅ Debe contener `DATABASE_URL="postgresql://..."`

### Problema #4: PostgreSQL no está corriendo
**Error esperado:** ECONNREFUSED 127.0.0.1:5432

**Solución:**
```bash
# En Windows, iniciar el servicio
net start postgresql-x64-15

# O desde PowerShell
Get-Service postgres* | Start-Service
```

### Problema #5: Error en ruta API tRPC
**Error esperado:** 404 Not Found

**Verificar:**
- ✅ Archivo existe: `app/api/trpc/[trpc]/route.ts`
- ✅ Exporta handlers: `export const { GET, POST } = ...`

## ✅ Checklist de Verificación

- [ ] PostgreSQL corriendo en puerto 5432
- [ ] Base de datos `axis_preicfes` existe
- [ ] `.env.local` tiene `DATABASE_URL` correcta
- [ ] Migraciones ejecutadas: `npm run db:push`
- [ ] `npm run dev` sin errores
- [ ] Endpoint `/api/trpc` accesible
- [ ] Tabla `Usuario` existe en BD
