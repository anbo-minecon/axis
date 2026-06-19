# 🎓 Integración Google Classroom — AXIS Pre-ICFES

**Fecha de implementación:** Junio 2026  
**Versión:** v0.5.0

---

## 📋 Resumen

Integración completa con la API real de Google Classroom que permite a administradores gestionar clases, calendario, grabaciones y miembros directamente desde AXIS, mientras los estudiantes consultan el contenido en modo de solo lectura. Los anuncios y tareas se extraen en tiempo real desde Google sin guardar datos innecesarios en la BD local.

---

## 🧩 Archivos Creados

### `lib/`

| Archivo | Descripción |
|---------|-------------|
| `lib/classroom-client.ts` | Wrapper de la API de Google Classroom. Maneja refresh automático de tokens, y expone funciones: `listarCursos`, `crearCurso`, `actualizarCurso`, `archivarCurso`, `listarEstudiantes`, `invitarEstudiante`, `listarTareas`, `crearTarea`, `publicarAnuncio`. |

### `app/api/classroom/`

| Archivo | Método | Descripción |
|---------|--------|-------------|
| `connect/route.ts` | GET | Inicia el flujo OAuth adicional con los scopes de Classroom. Redirige a Google con `access_type=offline` y `prompt=consent` para obtener refresh_token. Solo accesible por ADMIN y DOCENTE. |
| `callback/route.ts` | GET | Recibe el código OAuth de Google, intercambia por tokens y los guarda en `classroom_tokens`. Redirige a `/admin/classroom?connected=true`. |
| `clases/route.ts` | GET / POST | GET lista las clases según rol (estudiantes ven solo las de su grupo). POST crea la clase en Google Classroom y la guarda en BD. |
| `calendario/route.ts` | GET / POST | GET devuelve eventos filtrados por rango de fechas. POST crea un evento (solo ADMIN/DOCENTE). Estudiantes ven solo eventos de sus clases. |
| `grabaciones/route.ts` | GET / POST | GET lista grabaciones (con filtro por clase o materia). POST agrega una grabación con link externo (Drive, YouTube, etc.). |
| `tareas/route.ts` | GET / POST | GET lista tareas desde BD. POST crea tarea en Google Classroom y en BD simultáneamente. Si falla Google, guarda igual localmente. |
| `miembros/route.ts` | GET / POST | GET cruza estudiantes de Google Classroom vs Grupo AXIS. POST con `accion:"importar"` asigna usuario al grupo, `accion:"invitar"` envía invitación a Google. |
| `feed/route.ts` | GET | **Extrae anuncios y tareas EN TIEMPO REAL desde Google API.** No guarda nada en BD. Imágenes y miniaturas se sirven desde Google. Cache de 60s. Acepta `?courseId` o `?claseId`. Busca token del docente si el estudiante no tiene uno. |

### `app/admin/classroom/`

| Archivo | Descripción |
|---------|-------------|
| `page.tsx` | Panel principal de Classroom para admin. Muestra estado de conexión OAuth, botón conectar/reconectar, accesos rápidos a submódulos (Calendario, Grabaciones, Materiales, Miembros), listado de clases y formulario para crear clase nueva en Google. |
| `calendario/page.tsx` | Calendario mensual visual (grid 7×6). Días con eventos marcados con puntos de colores por tipo. Hover → tooltip con lista de eventos. Click en evento → modal con detalles completos y botón Meet. Click en día vacío → modal de creación de evento. |
| `clases/[id]/page.tsx` | Detalle de una clase con 3 tabs: Grabaciones (listar + agregar con form), Tareas (listar + crear con form que sincroniza a Google), Miembros (link a página de gestión). |
| `miembros/page.tsx` | Gestión de miembros. Tabla izquierda: estudiantes en Google Classroom con botón "Importar" para asignarlos al Grupo AXIS. Tabla derecha: estudiantes ya en el Grupo AXIS. Formulario para invitar por email a Google. |

### `app/dashboard/classroom/`

| Archivo | Descripción |
|---------|-------------|
| `page.tsx` | Vista principal del estudiante. Tabs: Mis Clases (cards clickeables con stats), Grabaciones (listado con links externos), Tareas (con indicador de urgencia por fecha). Acceso rápido al calendario. |
| `calendario/page.tsx` | Mismo diseño que el calendario admin pero solo lectura. Grid 7×6, puntos de colores, hover tooltip, click modal con botón "Unirse al Meet". Panel lateral con próximos eventos y resumen del mes. |
| `clases/[id]/page.tsx` | Tablón de la clase. Tab "Tablón": anuncios en tiempo real desde Google con texto, fecha y adjuntos (Drive, YouTube, Forms, Links con miniaturas). Tab "Tareas": tareas desde Google con fecha de entrega, puntos, adjuntos y link directo a Classroom. Botón "Actualizar" para refrescar. |

---

## 🗃️ Modelos de BD Agregados al Schema

```prisma
model ClassroomToken      # Tokens OAuth por usuario (access + refresh + expiry)
model ClassroomClase      # Clase sincronizada con Google (guarda googleCourseId)
model ClassroomEvento     # Evento del calendario (clase, tarea, examen, evento)
model ClassroomGrabacion  # Link de grabación asociado a una clase
model ClassroomTarea      # Tarea guardada en BD (sincronizada con Google)
```

**Enums agregados:** `EstadoClase`, `TipoEvento`, `EstadoTarea`

**Relaciones agregadas en modelos existentes:**
- `Usuario`: `classroomToken ClassroomToken?` y `classroomClases ClassroomClase[]`
- `Grupo`: `classroomClases ClassroomClase[]`

---

## 🔐 Variables de Entorno Requeridas

```env
GOOGLE_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_SECRET=tu-client-secret
NEXTAUTH_URL=http://localhost:3000
```

> Las mismas credenciales de Google OAuth del login se reutilizan para Classroom. El flujo de Classroom solicita scopes adicionales mediante un segundo consentimiento.

---

## 🔑 Scopes de Google Classroom Solicitados

```
openid email profile
https://www.googleapis.com/auth/classroom.courses
https://www.googleapis.com/auth/classroom.coursework.students
https://www.googleapis.com/auth/classroom.rosters
https://www.googleapis.com/auth/classroom.announcements
https://www.googleapis.com/auth/classroom.profile.emails
```

---

## 👥 Permisos por Rol

| Acción | Admin | Docente | Estudiante |
|--------|-------|---------|------------|
| Conectar cuenta Classroom | ✅ | ✅ | ❌ |
| Crear clase en Google | ✅ | ❌ | ❌ |
| Crear evento en calendario | ✅ | ✅ | ❌ |
| Agregar grabaciones | ✅ | ✅ | ❌ |
| Crear tareas | ✅ | ✅ | ❌ |
| Importar/invitar miembros | ✅ | ❌ | ❌ |
| Ver clases de su grupo | ✅ | ✅ | ✅ |
| Ver calendario (solo lectura) | ✅ | ✅ | ✅ |
| Ver grabaciones | ✅ | ✅ | ✅ |
| Ver anuncios (tiempo real) | ✅ | ✅ | ✅ |
| Ver tareas (tiempo real) | ✅ | ✅ | ✅ |

---

## 🔄 Flujo Completo de Uso

```
1. Admin → /admin/classroom → "Conectar cuenta"
2. Google → pantalla de permisos de Classroom
3. Callback → guarda access_token + refresh_token en BD
4. Admin crea clase → se crea en Google Classroom real + guarda en BD local
5. Admin asigna clase a un Grupo AXIS (vinculación)
6. Admin agrega eventos al calendario → estudiantes los ven en su dashboard
7. Admin sube links de grabaciones → estudiantes los ven con 1 clic
8. Admin crea tareas → se sincronizan a Google Classroom
9. Admin importa estudiantes de Google → asigna al Grupo AXIS automáticamente
10. Estudiante → /dashboard/classroom → ve sus clases
11. Estudiante → clic en clase → tablón con anuncios y tareas en tiempo real de Google
12. Estudiante → /dashboard/classroom/calendario → ve eventos, puede unirse al Meet
```

---

## ⚙️ Decisiones de Arquitectura

### Qué se guarda en BD local
- Tokens de OAuth (con refresh automático)
- Metadatos de clases (nombre, materia, googleCourseId, grupoId)
- Eventos del calendario (creados desde AXIS)
- Links de grabaciones (agregados manualmente)
- Tareas creadas desde AXIS (con googleWorkId de referencia)

### Qué NO se guarda en BD (viene directo de Google)
- **Anuncios**: texto, imágenes y adjuntos de Google Classroom
- **Imágenes y miniaturas**: se sirven directamente desde servidores de Google (Drive thumbnails, YouTube thumbnails)
- **Preguntas y respuestas de estudiantes** en Classroom
- **Calificaciones** de Google

> Esta decisión evita duplicar datos, mantiene las imágenes siempre actualizadas y reduce el tamaño de la BD.

### Cache de la API de Google
El endpoint `/api/classroom/feed` usa `next: { revalidate: 60 }` — cache de 60 segundos para no saturar la cuota de la API de Google (limite: 500 req/100s por proyecto).

### Token Fallback
Si un estudiante hace una petición al feed y no tiene token de Classroom, el sistema busca automáticamente el token del docente de esa clase para hacer la llamada a Google. El estudiante nunca necesita conectar su propia cuenta de Classroom.

---

## 📁 Archivos del README que NO son Necesarios

Los siguientes archivos aparecen en la estructura del README pero **no fueron creados** porque su funcionalidad quedó integrada en otros archivos:

| Archivo en README | Por qué no existe |
|-------------------|-------------------|
| `app/dashboard/classroom/grabaciones/page.tsx` | Las grabaciones se ven en el tab de `/dashboard/classroom/page.tsx` directamente |
| `app/dashboard/classroom/tareas/page.tsx` | Las tareas están en el tablón `/dashboard/classroom/clases/[id]/page.tsx` en tiempo real desde Google |
| `app/admin/classroom/grabaciones/page.tsx` | Las grabaciones del admin se gestionan desde el tab "Grabaciones" dentro de `/admin/classroom/clases/[id]/page.tsx` |

---

## 🐛 Errores Comunes y Solución

| Error | Causa | Solución |
|-------|-------|---------|
| `EPERM: operation not permitted` en Prisma | Windows bloquea el archivo `.dll` mientras el servidor corre | Detener servidor, cerrar VS Code, abrir PowerShell como Admin y ejecutar `Remove-Item -Recurse -Force node_modules\.prisma` luego `npx prisma generate` |
| `redirect_uri_mismatch` | URI de callback no configurada en Google Cloud | Agregar `http://localhost:3000/api/auth/callback/google` Y `http://localhost:3000/api/classroom/callback` en Google Cloud Console |
| `No hay token de Classroom` | Admin no ha conectado su cuenta | Ir a `/admin/classroom` → clic en "Conectar cuenta" |
| `Record to update not found` | PrismaAdapter buscaba `db.user` pero el modelo es `Usuario` | Solucionado con `CustomPrismaAdapter` en `lib/auth-adapter.ts` |
| Feed vacío con usuario sin token | Estudiante no tiene token de Classroom | El sistema usa token del docente automáticamente (token fallback) |
| Cuota API agotada | Demasiadas llamadas a Google API | Cache de 60s en `/api/classroom/feed` lo previene |

---

## 🚀 Comandos de Instalación

```bash
# 1. Migrar BD con los 5 modelos nuevos
npx prisma migrate dev --name add_classroom_integration

# 2. Regenerar cliente de Prisma
npx prisma generate

# 3. Reiniciar servidor
npm run dev
```

---

## 🔗 Rutas del Sistema

```
# Admin
/admin/classroom                    → Panel principal + crear clases
/admin/classroom/calendario         → Calendario visual admin (crear eventos)
/admin/classroom/clases/[id]        → Detalle clase (grabaciones, tareas, miembros)
/admin/classroom/miembros           → Importar/invitar estudiantes

# Estudiante
/dashboard/classroom                → Mis clases, grabaciones, tareas
/dashboard/classroom/clases/[id]    → Tablón (anuncios + tareas en tiempo real)
/dashboard/classroom/calendario     → Calendario visual solo lectura

# API
GET  /api/classroom/connect         → Inicia OAuth Classroom
GET  /api/classroom/callback        → Recibe token OAuth
GET  /api/classroom/clases          → Lista clases
POST /api/classroom/clases          → Crea clase en Google + BD
GET  /api/classroom/calendario      → Lista eventos del calendario
POST /api/classroom/calendario      → Crea evento
GET  /api/classroom/grabaciones     → Lista grabaciones
POST /api/classroom/grabaciones     → Agrega grabación
GET  /api/classroom/tareas          → Lista tareas desde BD
POST /api/classroom/tareas          → Crea tarea en Google + BD
GET  /api/classroom/miembros        → Cruza estudiantes Google vs AXIS
POST /api/classroom/miembros        → Importa o invita estudiante
GET  /api/classroom/feed            → Anuncios + tareas en tiempo real desde Google
```