# 📚 Documentación - AXIS Pre-ICFES

Bienvenido a la documentación del proyecto. Aquí encontrarás guías organizadas por tema.

## 🎯 Acceso Rápido

### Estoy empezando - ¿Qué hago primero?
👉 **Lee**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- Configuración de base de datos
- Variables de entorno
- Primeras migraciones
- Verificación del servidor

### Necesito información del rol Developer
👉 **Lee**: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) (3 min)
- Setup rápido en 3 pasos
- Credenciales iniciales

### Quiero la guía completa del rol Developer
👉 **Lee**: [DEVELOPER_ROLE.md](./DEVELOPER_ROLE.md) (15 min)
- Todas las funcionalidades
- Dashboard detallado
- Preguntas frecuentes

### Soy desarrollador - Detalles técnicos
👉 **Lee**: [DEVELOPER_IMPLEMENTATION.md](./DEVELOPER_IMPLEMENTATION.md) (20 min)
- Arquitectura técnica
- APIs disponibles
- Modelos de BD

### Sistema de Simulacros, Sesiones y TRI
👉 **Lee**: [SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md](./SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md) (30 min)
- Implementación completa
- Algoritmo TRI
- Checklist de verificación
- Instrucciones de migración BD

---

## 📋 Documentos Disponibles

| Documento | Propósito | Duración |
|-----------|-----------|----------|
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Setup inicial y configuración | 10 min |
| [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) | Inicio rápido rol Developer | 3 min |
| [DEVELOPER_ROLE.md](./DEVELOPER_ROLE.md) | Guía completa rol Developer | 15 min |
| [DEVELOPER_IMPLEMENTATION.md](./DEVELOPER_IMPLEMENTATION.md) | Detalles técnicos | 20 min |
| [SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md](./SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md) | Sistema simulacros completo | 30 min |
| [INDEX_DOCUMENTATION.md](./INDEX_DOCUMENTATION.md) | Índice de navegación | 2 min |

---

## 🗺️ Estructura del Proyecto

```
docs/                           ← Documentación
├── README.md                   ← Este archivo
├── BACKEND_SETUP.md
├── DEVELOPER_QUICKSTART.md
├── DEVELOPER_ROLE.md
├── DEVELOPER_IMPLEMENTATION.md
├── SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md
└── INDEX_DOCUMENTATION.md
```

---

## 🚀 Primeros Pasos (5 minutos)

1. **Configura el backend**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
   ```bash
   cp .env.example .env.local
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

2. **(Opcional) Activa rol Developer**: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)
   ```bash
   npx tsx scripts/setup-developer.ts
   ```

3. **Accede** a: `http://localhost:3000`

---

## 💡 Casos de Uso Comunes

### "Necesito configurar la base de datos"
→ [BACKEND_SETUP.md](./BACKEND_SETUP.md)

### "¿Cómo funciona el rol Developer?"
→ [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) o [DEVELOPER_ROLE.md](./DEVELOPER_ROLE.md)

### "Necesito los endpoints API del Developer"
→ [DEVELOPER_IMPLEMENTATION.md](./DEVELOPER_IMPLEMENTATION.md)

### "Tengo problemas con migraciones de BD"
→ [SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md](./SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md#-instrucciones-de-migración---schemaprisma)

### "¿Cómo funciona el algoritmo TRI?"
→ [SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md](./SIMULACRO_SESSIONS_TRI_IMPLEMENTATION.md#-algoritmo-tri)

---

## 📞 Preguntas Frecuentes

**P: ¿Dónde están los documentos principales?**
A: Los encontrarás en esta carpeta `docs/`. Los archivos `README.md`, `README_USUARIOS.md` y `Google-classroom.md` están en la raíz del proyecto.

**P: ¿Por dónde empiezo?**
A: Si es tu primera vez, empieza con [BACKEND_SETUP.md](./BACKEND_SETUP.md).

**P: ¿Qué necesito para el rol Developer?**
A: Lee [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) (3 minutos).

---

**¡Bienvenido al proyecto!** 🎉
