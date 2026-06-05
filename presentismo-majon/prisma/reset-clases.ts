/**
 * reset-clases.ts — borra todas las clases (y en cascada: asistencias, feedbacks, vínculos)
 * Luego correr: npx tsx prisma/seed-clases-2026.ts
 *
 * Uso: export $(cat prisma/cat.env | xargs) && npx tsx prisma/reset-clases.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑  Limpiando todo...')

  const a = await prisma.asistencia.deleteMany({})
  console.log(`✓ ${a.count} asistencias`)

  const fb = await prisma.feedback.deleteMany({})
  console.log(`✓ ${fb.count} feedbacks`)

  const ck = await prisma.claseKita.deleteMany({})
  console.log(`✓ ${ck.count} vínculos clase-kita`)

  const cd = await prisma.claseDocente.deleteMany({})
  console.log(`✓ ${cd.count} vínculos clase-docente`)

  const cl = await prisma.clase.deleteMany({})
  console.log(`✓ ${cl.count} clases`)

  console.log('\n✅ Listo. Ahora corré: npx tsx prisma/seed-clases-2026.ts')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
