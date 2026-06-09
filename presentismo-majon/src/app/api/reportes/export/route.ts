import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Solo clases pasadas no canceladas (hasta hoy inclusive)
    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)
    const clases = await prisma.clase.findMany({
      where: {
        cancelada: false,
        fecha: { lte: hoy },
        kitot: { some: { kitaId: session.kitaId } },
      },
      orderBy: { fecha: 'asc' },
      select: { id: true, fecha: true, diaSemana: true, titulo: true },
    })

    // Obtener todos los talmidim activos con sus asistencias
    const talmidim = await prisma.talmid.findMany({
      where: { activo: true, kitaId: session.kitaId },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      include: {
        asistencias: {
          select: { claseId: true, estado: true },
        },
      },
    })

    return NextResponse.json({
      clases: clases.map(c => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        titulo: c.titulo,
      })),
      talmidim: talmidim.map(t => ({
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        asistencias: Object.fromEntries(t.asistencias.map(a => [a.claseId, a.estado])),
      })),
    })
  } catch (error) {
    console.error('Error export:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
