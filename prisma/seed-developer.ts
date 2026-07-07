// prisma/seed-developer.ts
// Script para crear/actualizar credenciales de developer
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEVELOPER_EMAIL || 'dev@axis.com';
  const password = process.env.DEVELOPER_PASSWORD || 'developer123';
  const nombre = process.env.DEVELOPER_NAME || 'Developer';

  console.log('Configurando credenciales de developer...');
  console.log(`Email: ${email}`);

  // Buscar o crear usuario
  let usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    console.log('Creando nuevo usuario developer...');
    usuario = await prisma.usuario.create({
      data: {
        email,
        nombre,
        rol: 'DEVELOPER',
        emailVerified: new Date(),
      },
    });
  } else {
    console.log('Usuario existente encontrado, actualizando rol a DEVELOPER...');
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { rol: 'DEVELOPER' },
    });
  }

  // Crear o actualizar credenciales de developer
  const passwordHash = await bcrypt.hash(password, 10);

  const existingCred = await prisma.developerCredential.findUnique({
    where: { usuarioId: usuario.id },
  });

  if (existingCred) {
    console.log('Actualizando credenciales existentes...');
    await prisma.developerCredential.update({
      where: { usuarioId: usuario.id },
      data: {
        passwordHash,
        activo: true,
        ultimoAcceso: new Date(),
      },
    });
  } else {
    console.log('Creando nuevas credenciales...');
    await prisma.developerCredential.create({
      data: {
        usuarioId: usuario.id,
        passwordHash,
        activo: true,
        tokenSecret: Math.random().toString(36).substring(2),
      },
    });
  }

  console.log('✅ Credenciales de developer configuradas exitosamente');
  console.log(`Usuario ID: ${usuario.id}`);
  console.log(`Email: ${email}`);
  console.log(`Contraseña: ${password}`);
  console.log('');
  console.log('Puedes iniciar sesión en /developer/login con estas credenciales');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
