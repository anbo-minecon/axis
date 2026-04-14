# 🚀 GUÍA RÁPIDA: Hacer Funcionar el Registro

## ¿Qué está pasando?

El error "Error al registrar usuario" ocurre porque:

1. ✅ Base de datos existe y está sincronizada
2. ✅ Tablas están creadas
3. ✅ Backend tRPC está configurado
4. ✅ Frontend está configurado
5. ❓ **Algo en la lógica de creación del usuario está fallando**

## Pasos para diagnosticar y reparar

### PASO 1: Iniciar servidor con logs

```bash
npm run dev
```

Cuando hagas clic en "Crear mi cuenta", verás en la **consola del servidor**:

```
❌ Error en registro: [error detallado aquí]
```

**Este error te dirá exactamente qué está pasando.**

Posibles errores:

```
1. "Relation \"Usuario\" does not exist"
   → Las tablas no se sincronizaron
   → FIX: npm run db:push

2. "duplicate key value violates unique constraint"
   → El email ya existe
   → FIX: Usa un email diferente en el formulario

3. "column \"documento\" of relation \"Usuario\" does not exist"
   → El campo 'documento' no está en la BD
   → FIX: Ver abajo

4. "ECONNREFUSED" at 127.0.0.1:5432
   → PostgreSQL no está corriendo
   → FIX: Iniciar PostgreSQL

5. Otros errores de Prisma
   → FIX: npm run db:reset
```

### PASO 2: Verificar la tabla Usuario

Abre Prisma Studio:

```bash
npm run db:studio
```

Verás la BD visual. **Verifica:**
- ¿Existe la tabla "Usuario"?
- ¿Qué columnas tiene?
- ¿Hay datos ya ingresados?

### PASO 3: Sincronizar si el error es de schema

```bash
npm run db:push
```

Si ves "Schema needs an update", significa Prisma schema y BD no coinciden.

### PASO 4: Si nada funciona, reset completo

⚠️ **ESTO BORRA TODO. Solo usa si sabes qué haces:**

```bash
npm run db:reset
```

Esto:
1. Borra la BD
2. La vuelve a crear
3. Ejecuta migraciones
4. Ejecuta seed (carga datos iniciales)

## Flujo Completo Funcionando

Cuando TODO funcione correctamente:

```
Usuario escribe datos → 
  ↓
Frontend valida (Zod) → 
  ↓
Frontend envía a /api/trpc → 
  ↓
Servidor tRPC recibe → 
  ↓
Valida con Zod otra vez → 
  ↓
Hash contraseña con bcryptjs → 
  ↓
Prisma crea usuario en PostgreSQL → 
  ↓
Retorna success: true → 
  ↓
Toast muestra: "¡Cuenta creada!" → 
  ↓
Redirige a login
```

## Checklist Final

- [ ] PostgreSQL corriendo: `netstat -an | findstr 5432`
- [ ] npm run dev sin errores de compilación
- [ ] npm run db:push sin errores
- [ ] Formulario envía datos
- [ ] Miras consola del servidor para error
- [ ] Identificas el error específico
- [ ] Ejecutas el FIX recomendado
- [ ] Registras nuevo usuario ✅

## Comando de Prueba Rápida

Copiaey en el terminal:

```bash
cd c:\proyecto\axis-preicfes && npm run db:push && npm run dev
```

**Luego:**
1. Visita http://localhost:3000/auth/registro
2. Llena el formulario
3. Mira la consola del servidor para el error
4. **Comparte el error exacto aquí**

