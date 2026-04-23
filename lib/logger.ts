// lib/logger.ts
import fs from 'fs';
import path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Función para escribir logs en archivo
export function writeLog(level: 'INFO' | 'ERROR' | 'WARN', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data: data ? JSON.stringify(data) : undefined,
  };

  const logLine = `${JSON.stringify(logEntry)}\n`;
  
  // Nombre del archivo de log con fecha actual
  const fileName = `access-${new Date().toISOString().split('T')[0]}.log`;
  const filePath = path.join(logsDir, fileName);

  // Escribir en el archivo
  fs.appendFileSync(filePath, logLine, 'utf8');

  // También mostrar en consola para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}] ${timestamp}: ${message}`, data || '');
  }
}

// Función específica para logs de intentos
export function logIntento(data: {
  usuarioId: string;
  usuarioEmail?: string;
  accion: string;
  estado: string;
  ip?: string;
  userAgent?: string;
  detalles?: any;
}) {
  writeLog('INFO', `Intento de acceso: ${data.accion}`, {
    usuarioId: data.usuarioId,
    email: data.usuarioEmail,
    accion: data.accion,
    estado: data.estado,
    ip: data.ip,
    userAgent: data.userAgent,
    detalles: data.detalles,
    timestamp: new Date().toISOString()
  });
}

// Función para logs de errores
export function logError(message: string, error?: any) {
  writeLog('ERROR', message, error);
}

// Función para logs de advertencias
export function logWarning(message: string, data?: any) {
  writeLog('WARN', message, data);
}
