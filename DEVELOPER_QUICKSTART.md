# 🚀 Guía Rápida - Rol Developer

## Instalación Rápida (2 minutos)

### 1️⃣ Aplicar Migración
```bash
npm run db:migrate
```
**Ingresa "add_developer_role" cuando se pida el nombre**

### 2️⃣ Crear Usuario Developer
```bash
npx tsx scripts/setup-developer.ts
```

Recibirás:
- 📧 Email: `developer@axis-preicfes.local`
- 🔐 Contraseña: `Developer@2025#Secure`  
- 🎫 Token JWT: (guardado automáticamente)

### 3️⃣ Acceder al Dashboard
Abre tu navegador:
```
http://localhost:3000/developer/login
```

---

## 🎯 ¿Qué Puede Hacer el Developer?

### ✅ Ver Información del Sistema
- Usuarios totales y activos
- Simulacros realizados
- Distribución por roles
- Estado de módulos

### ✅ Acceso a Registros
- **System Logs**: Errores, advertencias, eventos del sistema
- **Audit Logs**: Historia completa de acciones administrativas
  - Quién hizo qué
  - Cuándo y desde dónde
  - Cambios antes/después

### ✅ Gestionar Respaldos
- Ver histórico de backups
- Crear respaldos bajo demanda
- Verificar estado y duración

### ✅ Monitorear Integraciones
- Google OAuth
- Base de datos PostgreSQL
- Cache Redis
- Email SMTP
- Otros servicios externos

---

## 🔐 Características de Seguridad

- ❌ **NO aparece** en la interfaz regular de usuarios
- ❌ **NO puede ser asignado** por administradores
- ✅ **Login independiente** (no usa formulario regular)
- ✅ **Autenticación con token JWT**
- ✅ **Cada acción es registrada** automáticamente

---

## 🛠️ Rutas Disponibles

### Para Usuarios Regular es
```
/auth/login          ← Login convencional (ESTUDIANTE, DOCENTE, ADMIN)
/dashboard           ← Dashboard principal
/admin               ← Panel de administración
```

### Para Developer (Oculto)
```
/developer/login     ← Login de Developer
/developer/dashboard ← Dashboard técnico
/api/developer/...   ← APIs especializadas
```

---

## 📊 Dashboard - Secciones

### 📈 Resumen
- Estadísticas en tiempo real
- Gráficos de distribución
- KPIs del sistema

### 📋 Registros
- Filtrado por nivel, componente
- Búsqueda avanzada
- Exportación de datos

### 🔄 Respaldos
- Crear backup FULL o INCREMENTAL
- Ver histórico completo
- Cambiar credenciales

### 🔗 Integraciones
- Estado en tiempo real
- Response times
- Tasa de errores

---

## 💡 Casos de Uso

### Monitoreo Diario
```
1. Accede a /developer/dashboard
2. Revisa la sección "Resumen"
3. Verifica estado de integraciones
4. Revisa últimos log s de errores
```

### Auditoría Administrativa
```
1. Ve a "Registros" → "Auditoría"
2. Filtra por usuario o acción específica
3. Consulta cambios realizados
4. Descarga reporte si necesitas
```

### Crear Respaldo
```
1. Ve a "Respaldos"
2. Click en "+ Crear Respaldo"
3. Selecciona tipo (FULL/INCREMENTAL)
4. Espera confirmación
```

---

## 🔑 Credenciales por Defecto

| Campo | Valor |
|-------|-------|
| **Email** | developer@axis-preicfes.local |
| **Contraseña** | Developer@2025#Secure |
| **Rol** | DEVELOPER (oculto) |

> ⚠️ **IMPORTANTE**: Cambia estos valores en producción

---

## 🚨 Si Pierdes Acceso

```bash
# Recrear credenciales de Developer
DEVELOPER_EMAIL=tu-email@empresa.com \
DEVELOPER_PASSWORD=nueva-contraseña \
npx tsx scripts/setup-developer.ts
```

---

## 📞 Preguntas Frecuentes

**P: ¿Por qué no veo el rol Developer en la lista de roles?**
A: Exacto. Es intencional. El rol está oculto para seguridad.

**P: ¿Puede el Admin asignar el rol Developer?**
A: No. El sistema lo rechaza automáticamente.

**P: ¿Dónde se guardan las credenciales?**
A: En tabla `developer_credentials`, encriptadas con bcryptjs.

**P: ¿Quién ve mis acciones?**
A: Solo quien acceda al `/api/developer/audit-logs` con autenticación.

---

## 📌 Recordatorios

✅ Cambiar contraseña después del primer login  
✅ Guardar el Token Secreto en lugar seguro  
✅ Revisar audit logs regularmente  
✅ Crear backups diarios  
✅ No compartir credenciales por chat/email  
✅ Mantener este rol confidencial  

---

**¡Listo para comenzar!** 🎉
