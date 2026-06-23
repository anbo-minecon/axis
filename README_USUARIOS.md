# Usuarios base — Axis Pre-ICFES

Creados con `scripts/seed-roles-usuarios.ts` directamente en la base de producción (Neon).

| Rol | Email | Password |
|---|---|---|
| ADMIN | admin@axis.local | `Password123` |
| DOCENTE | docente@axis.local | `Password123` |
| DEVELOPER | developer@axis.local | `anbo2019` |

## Cómo iniciar sesión
Entra a `/auth/login` y usa el email + password de la tabla.

## Cómo volver a correr el script (re-crear o actualizar estos usuarios)
```powershell
cd C:\proyecto\axis-preicfes
$env:DATABASE_URL="<DATABASE_URL de Neon>"; npx tsx scripts/seed-roles-usuarios.ts
```

## ⚠️ Seguridad
- Cambia estas contraseñas después del primer login — quedaron documentadas en texto plano.
- Si en algún momento quieres usar Google OAuth con estos mismos correos, NextAuth vincula la cuenta automáticamente (gracias a `allowDangerousEmailAccountLinking: true` en `lib/auth.ts`).
