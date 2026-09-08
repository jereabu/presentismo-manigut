import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rows = await prisma.$queryRaw<{ id: string; fecha: Date; titulo: string | null; kitas: string[] }[]>`
    SELECT c.id::text, c.fecha, c.titulo, array_agg(DISTINCT k.nombre) as kitas
    FROM "Clase" c
    JOIN "ClaseKita" ck ON ck."claseId" = c.id
    JOIN "Kita" k ON k.id = ck."kitaId"
    WHERE c.cancelada = false AND c.fecha <= NOW()
    ORDER BY c.fecha
  `

  return NextResponse.json(rows.map(r => ({
    id: r.id,
    fechaUTC: (r.fecha as unknown as Date).toISOString?.() ?? r.fecha,
    fechaAR: new Date((r.fecha as unknown as Date).getTime() - 3*3600*1000).toISOString().split('T')[0],
    titulo: r.titulo,
    kitas: r.kitas,
  })))
}
