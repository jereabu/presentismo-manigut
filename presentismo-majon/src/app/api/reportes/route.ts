import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularFaltas, calcularPorcentajeAsistencia, getTotalClasesPasadas } from '@/lib/asistencia'

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
          where: {
            clase: { cancelada: false },
          },
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

    // Clases pasadas no canceladas (hasta hoy) — se cargan una vez para evitar N+1 queries
    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)
    const clasesPasadas = await prisma.clase.findMany({
      where: {
        cancelada: false,
        fecha: { lte: hoy },
        kitot: { some: { kitaId: session.kitaId } },
      },
      select: { fecha: true },
    })
    const totalClases = clasesPasadas.length

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

      const faltas = calcularFaltas({ presentes, tardes, tardanzas, ausentes, justificados, viajes })
      // Denominador = registros propios del talmid (igual que la fórmula Excel MAX(0,...))
      const porcentajeAsistencia = calcularPorcentajeAsistencia(faltas, total)

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
