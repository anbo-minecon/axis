# 🔐 Rol Desarrollador (Developer Role) - CONFIDENCIAL

## ⚠️ IMPORTANCIA CRÍTICA DEL ROL

El rol **Desarrollador (DEVELOPER)** es un **nivel de privilegio especial** diseñado exclusivamente para tareas de:

- **Supervisión Técnica Avanzada**: Monitoreo en tiempo real del estado operativo del sistema
- **Auditoría y Cumplimiento**: Acceso a bitácoras completas de acciones administrativas
- **Mantenimiento del Sistema**: Gestión de respaldos, verificación de servicios e integraciones
- **Soporte Técnico**: Diagnóstico de problemas, análisis de errores y resolución de incidentes

### 🛡️ Características de Seguridad

1. **Visibilidad Restringida**: 
   - ❌ NO aparece en la interfaz de gestión de usuarios
   - ❌ NO es accesible desde módulos convencionales
   - ❌ NO puede ser listado, editado o asignado por administradores

2. **Autenticación Independiente**:
   - ✅ Login separado en `/developer/login`
   - ✅ Credenciales independientes del sistema general
   - ✅ Control mediante JWT tokens y tokenSecret

3. **Seguridad por Ocultamiento**:
   - Las credenciales se almacenan en tabla separada `developer_credentials`
   - Los intentos de acceso se registran inmediatamente
   - La ruta es invisible en navegación regular

---

## 🚀 SETUP INICIAL

### 1. Aplicar Migración de Base de Datos

```bash
npm run db:migrate
# Introduce un nombre para la migración, ej: "add_developer_role"
```

Esta migración creará las siguientes tablas:
- `developer_credentials` - Credenciales de Developer
- `audit_logs` - Registro de todas las acciones administrativas
- `system_logs` - Logs internos del sistema
- `backup_logs` - Historial de respaldos
- `integration_logs` - Estado de integraciones externas

### 2. Crear Usuario Developer

```bash
# Opción 1: Con credenciales por defecto
npx tsx scripts/setup-developer.ts

# Opción 2: Con variables de entorno personalizadas
DEVELOPER_EMAIL=midev@empresa.com DEVELOPER_PASSWORD=MiContraseña2025 npx tsx scripts/setup-developer.ts
```

El script generará:
- ✅ Usuario con rol DEVELOPER
- ✅ Credenciales encriptadas
- ✅ Token JWT inicial
- ✅ Token secreto de seguridad

### 3. Acceder al Dashboard

Navega a: `http://localhost:3000/developer/login`

**Credenciales por defecto** (cambiar tras primer acceso):
- Email: `developer@axis-preicfes.local`
- Contraseña: `Developer@2025#Secure`

---

## 📊 DASHBOARD DEL DEVELOPER

### Secciones Disponibles

#### 📈 **Resumen (Overview)**
- Estadísticas en tiempo real del sistema
- Usuarios totales y activos
- Distribución por roles
- Simulacros realizados hoy
- Gráficos de uso

#### 📋 **Registros (Logs)**
Acceso a dos tipos de registros:

**Logs del Sistema**:
- Nivel: INFO, WARN, ERROR, CRITICAL
- Componentes monitoreados:
  - 🔐 AUTH (autenticación)
  - 🗄️ DATABASE (base de datos)
  - 🌐 API (integraciones)
  - 💾 BACKUP (respaldos)
  - ⚙️ SERVICE (servicios internos)

**Auditoría**:
- Usuario que realizó la acción
- Tipo de acción (CREAR, EDITAR, ELIMINAR)
- Recurso afectado (usuario, grupo, plan)
- Timestamp y IP
- Cambios antes/después

#### 🔄 **Respaldos (Backups)**
- Historial completo de backups realizados
- Estados: INICIADO, EN_PROGRESO, COMPLETADO, ERROR
- Tamaño del backup (MB)
- Duración del proceso
- Ubicación del archivo

**Crear respaldo manualmente**:
```bash
curl -X POST http://localhost:3000/api/developer/backups \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"tipo": "FULL"}'
```

#### 🔗 **Integraciones (Integrations)**
Monitoreo de servicios externos:
- Google OAuth
- PostgreSQL Database
- Redis Cache
- Email Service (SMTP)
- Generador de Reportes

Métricas por integración:
- Estado (CONECTADO, ERROR, DEGRADED)
- Response Time (ms)
- Requests hoy
- Tasa de error (%)
- Última verificación

---

## 🔗 API ENDPOINTS (Solo para Developer)

Todos los endpoints requieren header: `Authorization: Bearer {TOKEN}`

### Login
```
POST /api/developer/login
Body: { "email": "...", "password": "..." }
Response: { "token": "...", "usuario": {...} }
```

### Dashboard
```
GET /api/developer/dashboard
Response: {
  "sistema": { usuariosTotales, usuariosActivos, porRol, simulacrosHoy },
  "logs": { sistema: [...], auditoria: [...] },
  "backups": [...],
  "integraciones": [...]
}
```

### Audit Logs
```
GET /api/developer/audit-logs?accion=CREAR_USUARIO&recurso=usuario&page=1&limit=50
Response: { "logs": [...], "pagination": {...} }
```

### System Logs
```
GET /api/developer/system-logs?nivel=ERROR&componente=DATABASE&page=1&limit=100
Response: { "logs": [...], "estadisticas": {...}, "pagination": {...} }
```

### Backups
```
GET /api/developer/backups
POST /api/developer/backups (crear nuevo backup)
Response: { "backups": [...], "ultimoBackup": {...} }
```

### Integraciones
```
GET /api/developer/integrations
Response: { "integraciones": [...], "resumen": { conectadas, conError, degradada, total } }
```

---

## 🛠️ FUNCIONALIDADES PRINCIPALES

### 1. 📍 Monitoreo del Sistema
- Ver estado en tiempo real de todos los módulos activos
- Identificar servicios degradados o caídos
- Histórico de cambios de estado

### 2. 🔍 Auditoría Completa
- Registro inmutable de **todas** las acciones administrativas
- Trazabilidad: quién, qué, cuándo, desde dónde
- Filtrado por tipo de acción, recurso y usuario
- Exportación de reportes de auditoría

### 3. 💾 Gestión de Respaldos
- Crear backups completos o incrementales bajo demanda
- Verificar integridad de respaldos anteriores
- Restaurar desde puntos específicos
- Gestión automática de retención

### 4. 🔧 Verificación de Servicios
- Health checks de base de datos
- Estado de conexiones externas (Google Auth, APIs)
- Rendimiento de caché
- Disponibilidad de servicios críticos

### 5. 📊 Análisis de Eventos
- Búsqueda avanzada en logs
- Alertas para eventos críticos
- Histórico de errores y soluciones
- Patrones de actividad

### 6. 🚨 Soporte Técnico
- Ver errores reportados por usuarios
- Acceso a stack traces completos
- Información de debugging detallada
- Contacto directo sin de intermediarios

---

## 🔒 SEGURIDAD Y RESTRICCIONES

### Restricciones del Rol Developer

```typescript
// ✅ Permitido (Developer)
- Leer audit logs
- Ver system logs
- Crear backups
- Ver estado de integraciones
- Monitorear módulos activos

// ❌ NO Permitido (Incluso para Developer)
- Crear, editar o eliminar usuarios
- Cambiar configuración de sistema
- Acceder a datos privados de usuarios
- Modificar auditoría
- Eludir seguridad de otros roles
```

### Requisitos de Acceso

1. Único login separado (`/developer/login`)
2. Credenciales independientes del sistema
3. Token JWT válido para cada sesión
4. Registro de IP en cada acceso
5. Auditoría automática de todas las acciones

### Protección de Credenciales

```env
# .env
DATABASE_URL=postgresql://...

# Las credenciales de Developer NO se almacenan aquí
# Se crean mediante script setup-developer.ts
# Se encriptan con bcryptjs
# Se validan contra hash almacenado
```

---

## 📋 TABLA DE MODELOS

### Usuario
```
- id: String (CUID)
- email: String (único)
- nombre: String
- rol: Rol (DEVELOPER)
- emailVerified: DateTime
- ...otros campos
```

### DeveloperCredential (encriptado)
```
- id: String
- usuarioId: String (FK a Usuario)
- passwordHash: String (bcrypt hash)
- tokenSecret: String (para HMAC)
- activo: Boolean
- ultimoAcceso: DateTime?
- direccionIP: String?
```

### AuditLog
```
- accion: String (CREAR, EDITAR, ELIMINAR)
- recurso: String (usuario, grupo, plan)
- recursoId: String?
- cambios: String? (JSON anterior/nuevo)
- resultado: String (EXITOSO, ERROR)
- usuarioId: String? (null si es sistema)
- ipAddress: String?
```

### SystemLog
```
- nivel: String (INFO, WARN, ERROR, CRITICAL)
- componente: String (AUTH, DATABASE, API, BACKUP)
- mensaje: String
- detalles: String? (JSON)
- stack: String? (stack trace)
```

### BackupLog
```
- tipo: String (FULL, INCREMENTAL)
- estado: String (INICIADO, EN_PROGRESO, COMPLETADO, ERROR)
- tamanio: Int? (MB)
- ubicacion: String? (path del backup)
- error: String?
- duracionMs: Int?
```

### IntegrationLog
```
- nombre: String (Google Auth, Stripe, etc)
- estado: String (CONECTADO, ERROR, DEGRADED)
- responseTime: Int? (ms)
- requestsHoy: Int?
- tasaError: Float? (%)
```

---

## 🚀 COMANDOS ÚTILES

```bash
# Setup inicial
npm run db:migrate
npx tsx scripts/setup-developer.ts

# Acceder al dashboard
open http://localhost:3000/developer/login

# Revisar logs en base de datos
npm run db:studio  # Buscar en tablas: audit_logs, system_logs

# Crear backup manual
curl -X POST http://localhost:3000/api/developer/backups \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"

# Obtener audit logs
curl http://localhost:3000/api/developer/audit-logs \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📞 SOPORTE Y MANTENIMIENTO

### Cambiar Contraseña del Developer

```sql
-- En Prisma Studio o SQL directo
UPDATE developer_credentials 
SET passwordHash = '$2a$10$...'  -- nuevo hash bcrypt
WHERE usuarioId = '...';
```

### Deshabilitar Developer Temporalmente

```sql
UPDATE developer_credentials 
SET activo = false 
WHERE usuarioId = '...';
```

### Ver Último Acceso del Developer

```sql
SELECT ultimoAcceso, direccionIP 
FROM developer_credentials 
ORDER BY ultimoAcceso DESC;
```

---

## ⚖️ CONFORMIDAD Y CUMPLIMIENTO

Este rol fue diseñado considerando:
- ✅ Principio de menor privilegio
- ✅ Auditoría total y trazabilidad
- ✅ Separación de preocupaciones
- ✅ Seguridad en profundidad (Defense in Depth)
- ✅ Conformidad GDPR/Data Privacy

---

## 📌 REMINDERS IMPORTANTES

1. **NO compartir credenciales** de Developer por chat, email o mensajes
2. **Cambiar contraseña** después del setup inicial
3. **Mantener token secreto** seguro (no comitear a git)
4. **Revisar logs regularmente** para detectar anomalías
5. **Crear backups** diariamente para producción
6. **Respetar confidencialidad** de los datos accesibles

---

**Última actualización**: 15 de Abril, 2026  
**Versión**: 1.0  
**Clasificación**: CONFIDENCIAL - SOLO DESARROLLADORES AUTORIZADOS
