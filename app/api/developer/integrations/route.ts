// app/api/developer/integrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let integraciones = await db.integrationLog.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // Si no existen integraciones registradas, crear registros por defecto
    if (integraciones.length === 0) {
      const integracionesPorDefecto = [
        {
          nombre: "Google OAuth",
          estado: "CONECTADO",
          responseTime: 245,
          requestsHoy: 45,
          tasaError: 0,
        },
        {
          nombre: "Base de Datos PostgreSQL",
          estado: "CONECTADO",
          responseTime: 15,
          requestsHoy: 3420,
          tasaError: 0.1,
        },
        {
          nombre: "Almacenamiento en Caché (Redis)",
          estado: "CONECTADO",
          responseTime: 5,
          requestsHoy: 12450,
          tasaError: 0,
        },
        {
          nombre: "Email Service (SMTP)",
          estado: "CONECTADO",
          responseTime: 850,
          requestsHoy: 23,
          tasaError: 2.5,
        },
        {
          nombre: "Generador de Reportes",
          estado: "CONECTADO",
          responseTime: 1200,
          requestsHoy: 8,
          tasaError: 0,
        },
      ];

      for (const integracion of integracionesPorDefecto) {
        await db.integrationLog.create({
          data: {
            nombre: integracion.nombre,
            estado: integracion.estado,
            responseTime: integracion.responseTime,
            requestsHoy: integracion.requestsHoy,
            tasaError: integracion.tasaError,
            ultimaVerif: new Date(),
          },
        });
      }

      integraciones = await db.integrationLog.findMany({
        orderBy: { updatedAt: "desc" },
      });
    }

    // Resumen de estado
    const resumen = {
      conectadas: integraciones.filter((i) => i.estado === "CONECTADO").length,
      conError: integraciones.filter((i) => i.estado === "ERROR").length,
      degradada: integraciones.filter((i) => i.estado === "DEGRADED").length,
      total: integraciones.length,
    };

    return NextResponse.json({
      integraciones,
      resumen,
    });
  } catch (error) {
    console.error("Error obtener integraciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
