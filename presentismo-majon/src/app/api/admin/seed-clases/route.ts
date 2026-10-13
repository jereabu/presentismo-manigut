import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const NUEVAS_CLASES = [
  // Miércoles - kita bet only
  { fecha: '2026-09-09', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-09-16', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-09-23', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-09-30', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-10-07', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-10-14', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-10-28', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-11-04', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-11-11', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-11-18', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-11-25', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  { fecha: '2026-12-02', diaSemana: 'miércoles', titulo: null, kitas: ['bet'] },
  // Viernes Talleres - bet + alef
  { fecha: '2026-11-13', diaSemana: 'viernes', titulo: 'Talleres', kitas: ['bet', 'alef'] },
]

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const kitasMap = Object.fromEntries(
    (await prisma.kita.findMany()).map(k => [k.nombre, k.id])
  )

  const results: { fecha: string; action: string }[] = []

  for (const c of NUEVAS_CLASES) {
    const fecha = new Date(`${c.fecha}T03:00:00.000Z`)

    // Check if any class already exists on this date for this kita combo
    const existing = await prisma.clase.findFirst({
      where: {
        fecha,
        cancelada: false,
        kitot: { some: { kitaId: kitasMap[c.kitas[0]] } },
      },
    })

    if (existing) {
      results.push({ fecha: c.fecha, action: 'skipped (already exists)' })
      continue
    }

    await prisma.clase.create({
      data: {
        fecha,
        diaSemana: c.diaSemana,
        titulo: c.titulo,
        cancelada: false,
        horaInicio: c.diaSemana === 'viernes' ? '17:30' : '18:30',
        horaFin:   c.diaSemana === 'viernes' ? '19:00' : '21:00',
        kitot: {
          create: c.kitas.map(nombre => ({ kitaId: kitasMap[nombre] })),
        },
      },
    })
    results.push({ fecha: c.fecha, action: 'created' })
  }

  return NextResponse.json({ ok: true, results })
}
