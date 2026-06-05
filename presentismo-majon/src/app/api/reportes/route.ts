import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const talmidId = searchParams.get('talmidId')

  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener todos los talmidim activos de la kitá
    const talmidim = await prisma.talmid.findMany({
      where: {
        activo: true,
        kitaId: session.kitaId
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      include: {
        asistencias: {
          include: {
            clase: true,
          },
          orderBy: {
            clase: {
              fecha: 'desc',
            },
          },
        },
      },
    })

    // Obtener total de clases de la kitá que no fueron canceladas
    const totalClases = await prisma.clase.count({
      where: {
        cancelada: false,
        kitot: {
          some: { kitaId: session.kitaId }
        }
      },
    })

    // Calcular estadisticas por talmid
    const reportes = talmidim.map((talmid) => {
      const asistencias = talmid.asistencias
      const presentes  = asistencias.filter((a) => a.estado === 'presente').length
      const tardes     = asistencias.filter((a) => a.estado === 'tarde').length
      const tardanzas  = asistencias.filter((a) => a.estado === 'presente_tarde').length
      const ausentes   = asistencias.filter((a) => a.estado === 'ausente').length
      const justificados = asistencias.filter((a) => a.estado === 'ausente_justificado').length
      const viajes     = asistencias.filter((a) => a.estado === 'viaje').length
      const total = presentes + tardes + tardanzas + ausentes + justificados + viajes

      // Fórmula excel: (total - faltas) / total
      // A/AJ/V = 1 falta, T (tarde) = 0.5, PT (presente_tarde) = 0.25
      const faltas = ausentes * 1 + justificados * 1 + viajes * 1 + tardes * 0.5 + tardanzas * 0.25
      const porcentajeAsistencia = total > 0
        ? Math.round(((total - faltas) / total) * 100)
        : 0

      return {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        presentes,
        tardanzas,
        ausentes,
        justificados,
        viajes,
        totalClasesTomadas: total,
        porcentajeAsistencia,
        historial: talmidId === talmid.id
          ? asistencias.map((a) => ({
              fecha: a.clase.fecha.toISOString().split('T')[0],
              diaSemana: a.clase.diaSemana,
              estado: a.estado,
              justificacion: a.justificacion,
            }))
          : undefined,
      }
    })

    return NextResponse.json({
      totalClases,
      reportes,
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
