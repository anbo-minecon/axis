const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Intentando conectarse a la base de datos...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Intenta hacer una consulta simple
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Conexión exitosa!');
    console.log('PostgreSQL version:', result[0]);
    
    // Intenta contar usuarios
    const userCount = await prisma.usuario.count();
    console.log('✅ Cantidad de usuarios en BD:', userCount);
    
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('Nombre:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    
    if (error.message.includes('Authentication failed')) {
      console.error('\n⚠️  PROBLEMA DE AUTENTICACIÓN');
      console.error('Las credenciales postgres:postgres NO son válidas para PostgreSQL.');
      console.error('\nOpciones:');
      console.error('1. Reseteear la contraseña de PostgreSQL');
      console.error('2. Cambiar la contraseña en .env.local a la correcta');
      console.error('3. Usar pgAdmin4 o psql CLI directamente para verificar');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
