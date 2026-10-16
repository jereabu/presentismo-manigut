import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const asistencias = await prisma.asistencia.findMany({
    where: { talmidId: session.talmidId },
    include: { clase: { select: { fecha: true, titulo: true, diaSemana: true, cancelada: true } } },
    orderBy: { clase: { fecha: 'desc' } },
  })

  const registros = asistencias
    .filter(a => !a.clase.cancelada)
    .map(a => ({
      fecha: a.clase.fecha.toISOString().split('T')[0],
      diaSemana: a.clase.diaSemana,
      titulo: a.clase.titulo,
      estado: a.estado,
    }))

  const totales = registros.reduce(
    (acc, r) => {
      if (r.estado === 'presente') acc.presentes++
      else if (r.estado === 'tarde') acc.tardes++
      else if (r.estado === 'presente_tarde') acc.presenteTarde++
      else if (r.estado === 'ausente') acc.ausentes++
      else if (r.estado === 'ausente_justificado') acc.justificados++
      else if (r.estado === 'viaje') acc.viajes++
      return acc
    },
    { presentes: 0, tardes: 0, presenteTarde: 0, ausentes: 0, justificados: 0, viajes: 0 }
  )

  const total = Object.values(totales).reduce((a, b) => a + b, 0)
  const faltas = totales.ausentes + totales.justificados + totales.viajes + totales.tardes * 0.5 + totales.presenteTarde * 0.25
  const porcentaje = total > 0 ? Math.round(Math.max(0, (total - faltas) / total) * 100) : 0

  return NextResponse.json({ totales, porcentaje, total, registros })
}
