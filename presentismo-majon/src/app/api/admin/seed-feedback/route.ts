import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * Ruta de administración de uso único.
 * Inserta feedback vacío (" ", rating=0) para todos los talmidim
 * en todas las clases hasta el 10/06/2026, sin pisar feedbacks reales.
 *
 * GET /api/admin/seed-feedback
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const hasta = new Date('2026-06-10T23:59:59Z')

  const clases = await prisma.clase.findMany({
    where: { fecha: { lte: hasta }, cancelada: false },
    select: { id: true, fecha: true, kitot: { select: { kitaId: true } } },
  })

  const talmidim = await prisma.talmid.findMany({
    where: { activo: true },
    select: { id: true, kitaId: true },
  })

  let creados = 0
  let saltados = 0

  for (const clase of clases) {
    const kitaIds = clase.kitot.map(k => k.kitaId)
    const talmidimsDeKita = talmidim.filter(t => t.kitaId !== null && kitaIds.includes(t.kitaId))

    for (const talmid of talmidimsDeKita) {
      const existente = await prisma.feedback.findUnique({
        where: { talmidId_claseId: { talmidId: talmid.id, claseId: clase.id } },
      })

      // No pisar feedbacks reales (rating > 0 o comentario con contenido)
      if (existente && (existente.claseRating > 0 || (existente.claseComentario && existente.claseComentario.trim().length > 0))) {
        saltados++
        continue
      }

      await prisma.feedback.upsert({
        where: { talmidId_claseId: { talmidId: talmid.id, claseId: clase.id } },
        create: {
          talmidId: talmid.id,
          claseId: clase.id,
          claseRating: 0,
          claseComentario: ' ',
        },
        update: {
          claseRating: 0,
          claseComentario: ' ',
        },
      })
      creados++
    }
  }

  return NextResponse.json({ ok: true, creados, saltados })
}
