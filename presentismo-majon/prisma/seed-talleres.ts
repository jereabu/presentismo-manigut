/**
 * seed-talleres.ts
 * Marca todas las clases de los viernes como "Talleres" y crea/vincula 4 slots de capacitadores.
 *
 * Uso: export $(cat prisma/cat.env | xargs) && npx tsx prisma/seed-talleres.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 4 capacitadores placeholder — editá nombres/apellidos según corresponda
const CAPACITADORES = [
  { id: 'cap-1', nombre: 'Capacitador', apellido: '1', tipo: 'capacitador' },
  { id: 'cap-2', nombre: 'Capacitador', apellido: '2', tipo: 'capacitador' },
  { id: 'cap-3', nombre: 'Capacitador', apellido: '3', tipo: 'capacitador' },
  { id: 'cap-4', nombre: 'Capacitador', apellido: '4', tipo: 'capacitador' },
]

async function main() {
  console.log('🌱 Configurando Talleres en clases de viernes...\n')

  // 1. Asegurar que existen los 4 capacitadores
  await prisma.docente.createMany({ data: CAPACITADORES, skipDuplicates: true })
  console.log('✓ 4 capacitadores asegurados')

  // 2. Obtener todas las clases de viernes
  const viernes = await prisma.clase.findMany({
    where: { diaSemana: 'viernes' },
    select: { id: true, fecha: true },
  })
  console.log(`✓ ${viernes.length} clases de viernes encontradas`)

  // 3. Marcar todas como "Talleres"
  await prisma.clase.updateMany({
    where: { diaSemana: 'viernes' },
    data: { titulo: 'Talleres' },
  })
  console.log('✓ Título "Talleres" aplicado a todas las clases de viernes')

  // 4. Vincular los 4 capacitadores a cada clase de viernes (sin duplicados)
  const links = viernes.flatMap(c =>
    CAPACITADORES.map(d => ({ claseId: c.id, docenteId: d.id }))
  )
  await prisma.claseDocente.createMany({ data: links, skipDuplicates: true })
  console.log(`✓ ${CAPACITADORES.length} capacitadores vinculados a cada clase de viernes`)

  console.log('\n✅ Listo. Editá los nombres de los capacitadores desde el cronograma o la DB.')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
