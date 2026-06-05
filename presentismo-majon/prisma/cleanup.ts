/**
 * cleanup.ts — limpia docentes y corrige asistencia de Kuschnir
 * Uso: export $(cat prisma/cat.env | xargs) && npx tsx prisma/cleanup.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DOCENTES = [
  { id: 'doc-viole', nombre: 'Viole', apellido: 'Pieniazek', tipo: 'mejanej' },
  { id: 'doc-jere',  nombre: 'Jere',  apellido: 'Abulafia',  tipo: 'mejanej' },
  { id: 'doc-sofi',  nombre: 'Sofi',  apellido: 'Cattaneo',  tipo: 'mejanej' },
]

// Asistencia de Kuschnir según el excel
// cols [0]=27/03(ignorar) [1]=08/04 ... [12]=03/06
const KUSHCHNIR_V = ['','P','P','P','A','P','P','P','P','A','P','P','A']

const IDX_A_CLASES: Record<number, string[]> = {
  1:  ['c01','c02'],
  2:  ['c03'],
  3:  ['c04','c05'],
  4:  ['c06','c07'],
  5:  ['c08'],
  6:  ['c09','c10'],
  7:  ['c11','c12'],
  8:  ['c13'],
  9:  ['c14','c15'],
  10: ['c17','c18'],
  11: ['c20','c21'],
  12: ['c22','c23'],
}

const MAP: Record<string,string> = {
  P:'presente', T:'tarde', PT:'presente_tarde',
  A:'ausente', AJ:'ausente_justificado', V:'viaje',
}

async function main() {
  // ── 1. Docentes ──────────────────────────────────────────────────────────
  console.log('🧹 Limpiando docentes...')

  // Borrar todos los docentes que NO sean los 3 oficiales
  const ids = DOCENTES.map(d => d.id)
  const { count: borrados } = await prisma.docente.deleteMany({
    where: { id: { notIn: ids } }
  })
  console.log(`  ✓ ${borrados} docentes extra eliminados`)

  // Asegurar que los 3 oficiales existen
  await prisma.docente.createMany({ data: DOCENTES, skipDuplicates: true })
  console.log('  ✓ 3 mejanjim asegurados (Viole, Jere, Sofi)')

  // Vincular los 3 a todas las clases que no los tengan
  const clases = await prisma.clase.findMany({ select: { id: true } })
  const links = clases.flatMap(c => DOCENTES.map(d => ({ claseId: c.id, docenteId: d.id })))
  await prisma.claseDocente.createMany({ data: links, skipDuplicates: true })
  console.log(`  ✓ Docentes vinculados a ${clases.length} clases`)

  // ── 2. Asistencia de Kuschnir ───────────────────────────────────────────
  console.log('\n📋 Corrigiendo asistencia de Kuschnir Joaquin...')

  const talmid = await prisma.talmid.findFirst({
    where: {
      apellido: { equals: 'Kuschnir', mode: 'insensitive' },
      nombre:   { startsWith: 'Joaquin', mode: 'insensitive' },
    }
  })

  if (!talmid) {
    console.warn('  ⚠ Kuschnir Joaquin no encontrado en la DB')
  } else {
    // Borrar sus asistencias pasadas
    const clasesPasadas = Object.values(IDX_A_CLASES).flat()
    await prisma.asistencia.deleteMany({
      where: { talmidId: talmid.id, claseId: { in: clasesPasadas } }
    })

    // Reinsertar desde el excel
    const registros = []
    for (let i = 1; i <= 12; i++) {
      const val = KUSHCHNIR_V[i]
      if (!val) continue
      const estado = MAP[val]
      if (!estado) continue
      for (const claseId of IDX_A_CLASES[i]) {
        registros.push({ talmidId: talmid.id, claseId, estado })
      }
    }
    await prisma.asistencia.createMany({ data: registros })
    console.log(`  ✓ ${registros.length} registros de asistencia corregidos`)
    console.log('  Detalle: 3 ausentes (22/04, 13/05, 03/06) → 75% asistencia')
  }

  console.log('\n✅ Listo.')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
