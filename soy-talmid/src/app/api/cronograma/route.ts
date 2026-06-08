import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Obtener kitaId del talmid
    const talmid = await prisma.talmid.findUnique({
      where: { id: session.talmidId },
      select: { kitaId: true },
    })
    if (!talmid || !talmid.kitaId) return NextResponse.json({ error: 'Talmid no encontrado' }, { status: 404 })

    // Clases de la kitá del talmid
    const clases = await prisma.clase.findMany({
      where: {
        kitot: { some: { kitaId: talmid.kitaId as string } },
      },
      orderBy: { fecha: 'asc' },
      select: {
        id: true,
        fecha: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
        titulo: true,
        cancelada: true,
        tipo: true,
      },
    })

    // Asistencias del talmid
    const asistencias = await prisma.asistencia.findMany({
      where: { talmidId: session.talmidId },
      select: { claseId: true, estado: true, justificacion: true },
    })
    const asistenciaMap = Object.fromEntries(asistencias.map(a => [a.claseId, a]))

    // Feriados
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: 'asc' },
      select: { id: true, fecha: true, nombre: true, tipo: true },
    })

    return NextResponse.json({
      clases: clases.map(c => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        titulo: c.titulo,
        cancelada: c.cancelada,
        tipo: c.tipo,
        asistencia: asistenciaMap[c.id] ?? null,
      })),
      feriados: feriados.map(f => ({
        id: f.id,
        fecha: f.fecha.toISOString().split('T')[0],
        nombre: f.nombre,
        tipo: f.tipo,
      })),
    })
  } catch (error) {
    console.error('Error fetching cronograma:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
