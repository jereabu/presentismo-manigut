import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rows = await prisma.$queryRaw<{ fecha: Date; titulo: string | null; ids: string[] }[]>`
    SELECT c.fecha::date as fecha, c.titulo, array_agg(DISTINCT c.id::text) as ids, array_agg(DISTINCT k.nombre) as kitas
    FROM "Clase" c
    JOIN "ClaseKita" ck ON ck."claseId" = c.id
    JOIN "Kita" k ON k.id = ck."kitaId"
    WHERE c.cancelada = false AND c.fecha <= NOW()
    GROUP BY c.fecha::date, c.titulo
    HAVING count(DISTINCT c.id) > 1
    ORDER BY c.fecha
  `

  return NextResponse.json(rows.map(r => ({
    fecha: (r.fecha as unknown as Date).toISOString?.().split('T')[0] ?? r.fecha,
    titulo: r.titulo,
    ids: r.ids,
  })))
}
