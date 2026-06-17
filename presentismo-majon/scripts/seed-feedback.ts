/**
 * Script para insertar feedback vacío (" ") para todos los talmidim
 * en todas las clases hasta el 10/06/2026.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npx ts-node scripts/seed-feedback.ts
 *
 * Solo hace upsert — no sobreescribe feedbacks reales ya existentes (detecta claseRating > 0).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const hasta = new Date('2026-06-10T23:59:59Z')

  // Clases hasta el 10/06
  const clases = await prisma.clase.findMany({
    where: { fecha: { lte: hasta }, cancelada: false },
    select: { id: true, fecha: true, kitot: { select: { kitaId: true } } },
  })

  // Talmidim activos
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
      // Solo insertar si no existe ya un feedback real
      const existente = await prisma.feedback.findUnique({
        where: { talmidId_claseId: { talmidId: talmid.id, claseId: clase.id } },
      })

      if (existente && existente.claseRating > 0) {
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

  console.log(`Feedbacks creados/actualizados: ${creados}`)
  console.log(`Feedbacks reales saltados: ${saltados}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
