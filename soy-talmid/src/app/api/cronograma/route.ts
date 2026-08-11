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

    // Asistencias del talmid (solo clases no canceladas)
    const asistencias = await prisma.asistencia.findMany({
      where: { talmidId: session.talmidId, clase: { cancelada: false } },
      select: { claseId: true, estado: true, justificacion: true },
    })
    const asistenciaMap = Object.fromEntries(asistencias.map((a: { claseId: string; estado: string; justificacion: string | null }) => [a.claseId, a]))

    // Calcular porcentaje igual que presentismo-majon (denominador = registros propios)
    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)
    const faltasPeso: Record<string, number> = {
      ausente: 1, ausente_justificado: 1, viaje: 1, tarde: 0.5, presente_tarde: 0.25, presente: 0,
    }
    let totalPropios = 0
    let faltas = 0
    for (const a of asistencias) {
      const clase = clases.find(c => c.id === a.claseId)
      if (!clase || clase.fecha > hoy) continue
      totalPropios++
      faltas += faltasPeso[a.estado] ?? 1
    }
    const porcentajeAsistencia = totalPropios > 0
      ? Math.max(0, Math.round(((totalPropios - faltas) / totalPropios) * 100))
      : null

    // Feriados
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: 'asc' },
      select: { id: true, fecha: true, nombre: true, tipo: true },
    })

    return NextResponse.json({
      porcentajeAsistencia,
      clases: clases.map((c: { id: string; fecha: Date; diaSemana: string; horaInicio: string; horaFin: string; titulo: string | null; cancelada: boolean; tipo: string }) => ({
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
      feriados: feriados.map((f: { id: string; fecha: Date; nombre: string; tipo: string }) => ({
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
