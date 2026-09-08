import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clases = await prisma.clase.findMany({
    where: { cancelada: false, fecha: { lte: new Date() } },
    orderBy: { fecha: 'asc' },
    select: {
      id: true,
      fecha: true,
      titulo: true,
      diaSemana: true,
      kitot: { select: { kita: { select: { nombre: true } } } },
    },
  })

  return NextResponse.json(clases.map(c => ({
    id: c.id,
    fechaUTC: c.fecha.toISOString(),
    fechaDate: c.fecha.toISOString().split('T')[0],
    titulo: c.titulo,
    dia: c.diaSemana,
    kitas: c.kitot.map(k => k.kita.nombre),
  })))
}
