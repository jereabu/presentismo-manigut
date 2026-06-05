/**
 * seed-clases-2026.ts
 * Uso: export $(cat prisma/cat.env | xargs) && npx tsx prisma/seed-clases-2026.ts
 *
 * Columnas del excel (13 en total):
 * [0]=27/03  [1]=08/04  [2]=10/04  [3]=15/04  [4]=22/04  [5]=24/04
 * [6]=29/04  [7]=06/05  [8]=08/05  [9]=13/05  [10]=20/05 [11]=27/05 [12]=03/06
 *
 * [0] se ignora (no existe en DB). Solo se procesan [1]–[12].
 *
 * Valores: P=presente  T=tarde  PT=presente_tarde  A=ausente  AJ=ausente_justificado  V=viaje
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function f(y: number, m: number, d: number) { return new Date(y, m - 1, d) }

const HOY = new Date(2026, 5, 5)
const PASADA = (fecha: Date) => fecha <= HOY

const DOCENTES = [
  { id: 'doc-viole', nombre: 'Viole',  apellido: 'Pieniazek', tipo: 'mejanej' },
  { id: 'doc-jere',  nombre: 'Jere',   apellido: 'Abulafia',  tipo: 'mejanej' },
  { id: 'doc-sofi',  nombre: 'Sofi',   apellido: 'Cattaneo',  tipo: 'mejanej' },
]

const CLASES = [
  { id: 'c01', fecha: f(2026,4,8),  dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Educación en valores 1' },
  { id: 'c02', fecha: f(2026,4,8),  dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Marco: acuerdos y compromisos' },
  { id: 'c03', fecha: f(2026,4,10), dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Talleres' },
  { id: 'c04', fecha: f(2026,4,15), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Educación en valores 2' },
  { id: 'c05', fecha: f(2026,4,15), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Iom Hashoa' },
  { id: 'c06', fecha: f(2026,4,22), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Educación en valores 3' },
  { id: 'c07', fecha: f(2026,4,22), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Proyecto - Acto cultura' },
  { id: 'c08', fecha: f(2026,4,24), dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Talleres' },
  { id: 'c09', fecha: f(2026,4,29), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Israel como impact Nation' },
  { id: 'c10', fecha: f(2026,4,29), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Yo como agente de cambio' },
  { id: 'c11', fecha: f(2026,5,6),  dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Pedagogía lúdica - LITZOR' },
  { id: 'c12', fecha: f(2026,5,6),  dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Proyecto - Juego de mesa' },
  { id: 'c13', fecha: f(2026,5,8),  dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Agentes de cambio 1' },
  { id: 'c14', fecha: f(2026,5,13), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Agentes de cambio 2' },
  { id: 'c15', fecha: f(2026,5,13), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Proyecto - Juego de mesa' },
  { id: 'c16', fecha: f(2026,5,15), dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Agentes de cambio 3' },
  { id: 'c17', fecha: f(2026,5,20), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Materia' },
  { id: 'c18', fecha: f(2026,5,20), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Proyecto' },
  { id: 'c19', fecha: f(2026,5,23), dia: 'sábado',    ini: '10:00', fin: '14:00', titulo: 'Implementación de juegos de mesa' },
  { id: 'c20', fecha: f(2026,5,27), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Planificación 1' },
  { id: 'c21', fecha: f(2026,5,27), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Planificar en LH' },
  { id: 'c22', fecha: f(2026,6,3),  dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Planificación 2' },
  { id: 'c23', fecha: f(2026,6,3),  dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Dinámica grupal' },
  { id: 'c24', fecha: f(2026,6,5),  dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Talleres' },
  { id: 'c25', fecha: f(2026,6,10), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Planificación 3' },
  { id: 'c26', fecha: f(2026,6,10), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Dinámicas grupales' },
  { id: 'c27', fecha: f(2026,6,17), dia: 'miércoles', ini: '09:00', fin: '21:00', titulo: 'Encuentro de escuelas' },
  { id: 'c28', fecha: f(2026,6,19), dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Talleres' },
  { id: 'c29', fecha: f(2026,6,24), dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Psico evolutiva 1' },
  { id: 'c30', fecha: f(2026,6,24), dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Hora mejan' },
  { id: 'c31', fecha: f(2026,7,1),  dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Psico evolutiva 2' },
  { id: 'c32', fecha: f(2026,7,1),  dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Judaismo en la diaspora' },
  { id: 'c33', fecha: f(2026,7,3),  dia: 'viernes',   ini: '17:00', fin: '21:00', titulo: 'Viernes' },
  { id: 'c34', fecha: f(2026,7,8),  dia: 'miércoles', ini: '18:10', fin: '19:20', titulo: 'Definir contenido' },
  { id: 'c35', fecha: f(2026,7,8),  dia: 'miércoles', ini: '19:35', fin: '20:30', titulo: 'Proyecto' },
  { id: 'c36', fecha: f(2026,7,11), dia: 'sábado',    ini: '10:00', fin: '14:00', titulo: 'Primer sábado de prácticas' },
  { id: 'c37', fecha: f(2026,7,15), dia: 'miércoles', ini: '18:10', fin: '20:30', titulo: 'Covisiones' },
  { id: 'c38', fecha: f(2026,7,17), dia: 'viernes',   ini: '19:00', fin: '22:00', titulo: 'Kabalat Shabat + cena' },
]

// índices [1]–[12] del excel → class IDs
// [0]=27/03 se ignora
const IDX_A_CLASES: Record<number, string[]> = {
  1:  ['c01', 'c02'], // 08/04
  2:  ['c03'],        // 10/04
  3:  ['c04', 'c05'], // 15/04
  4:  ['c06', 'c07'], // 22/04
  5:  ['c08'],        // 24/04
  6:  ['c09', 'c10'], // 29/04
  7:  ['c11', 'c12'], // 06/05
  8:  ['c13'],        // 08/05
  9:  ['c14', 'c15'], // 13/05
  10: ['c17', 'c18'], // 20/05
  11: ['c20', 'c21'], // 27/05
  12: ['c22', 'c23'], // 03/06
}

const MAP: Record<string, string> = {
  P: 'presente', T: 'tarde', PT: 'presente_tarde',
  A: 'ausente', AJ: 'ausente_justificado', V: 'viaje',
}

// Datos del excel — 13 valores por fila (índice 0 = 27/03, ignorado)
// '' = celda vacía (no estaba inscripto ese día) → se omite del DB
type Row = { ap: string; nom: string; v: string[] }

const EXCEL: Row[] = [
  { ap:'Attas',        nom:'Delfina',  v:['P','P','P','P','T', 'A', 'PT','P','P', 'AJ','A', 'A', 'A'  ]},
  { ap:'Bal',          nom:'Matias',   v:['P','P','A','P','P', 'P', 'T', 'P','T', 'T', 'P', 'P', 'T'  ]},
  { ap:'Birbayer',     nom:'Julian',   v:['P','P','A','A','A', 'P', 'A', 'P','P', 'A', 'P', 'P', 'AJ' ]},
  { ap:'Bompadre',     nom:'Carola',   v:['P','P','A','PT','P','P', 'P', 'P','A', 'T', 'P', 'P', 'A'  ]},
  { ap:'Budman',       nom:'Lola',     v:['P','P','P','P','PT','P', 'P', 'P','P', 'T', 'P', 'P', 'A'  ]},
  { ap:'Cattaneo',     nom:'Benicio',  v:['P','P','A','A','A', 'A', 'A', 'P','P', 'P', 'V', 'V', 'P'  ]},
  { ap:'Dain',         nom:'Melina',   v:['P','P','P','P','A', 'P', 'P', 'P','A', 'T', 'P', 'PT','A'  ]},
  { ap:'Dyjament',     nom:'Tadeo',    v:['P','P','AJ','P','P','P', 'A', 'P','AJ','P', 'P', 'P', 'P'  ]},
  { ap:'Divinsky',     nom:'Joaquin',  v:['', 'P','P', 'PT','P','P','A', 'P','A', 'T', 'P', 'P', 'V'  ]},
  { ap:'Ezernitchi',   nom:'Luna',     v:['P','P','P','P','A', 'A', 'A', 'P','P', 'AJ','P', 'P', 'A'  ]},
  { ap:'Frenkel',      nom:'Tomer',    v:['', 'P','P', 'PT','P','P','PT','P','A', 'T', 'P', 'T', 'A'  ]},
  { ap:'Fridman',      nom:'Jazmin',   v:['P','P','P','A','P', 'P', 'A', 'P','A', 'P', 'P', 'PT','AJ' ]},
  { ap:'Gel',          nom:'Lucas',    v:['P','P','P','PT','AJ','T','A', 'P','A', 'A', 'P', 'PT','T'   ]},
  { ap:'Gimpel',       nom:'Mia',      v:['P','P','P','PT','P','P', 'P', 'A','P', 'P', 'A', 'P', 'P'  ]},
  { ap:'Gola',         nom:'Lucas',    v:['P','P','P','P','A', 'P', 'P', 'P','P', 'P', 'P', 'P', 'P'  ]},
  { ap:'Gola',         nom:'Tobias',   v:['P','P','P','A','A', 'P', 'PT','A','P', 'A', 'P', 'PT','A'  ]},
  { ap:'Goldenberg',   nom:'Ema',      v:['', 'P','P', 'P','A','P', 'P', 'P','A', 'P', 'P', 'P', 'A'  ]},
  { ap:'Goldestein',   nom:'Manuela',  v:['P','P','A','P','T', 'P', 'V', 'P','A', 'P', 'P', 'T', 'T'  ]},
  { ap:'Gribov',       nom:'Ilai',     v:['P','P','P','P','P', 'P', 'T', 'T','T', 'T', 'P', 'A', 'T'  ]},
  { ap:'Grunewald',    nom:'Juliana',  v:['P','P','P','V','V', 'P', 'P', 'P','P', 'A', 'P', 'P', 'P'  ]},
  { ap:'Guildenfenik', nom:'Bianca',   v:['P','P','A','P','P', 'P', 'P', 'P','P', 'A', 'P', 'P', 'P'  ]},
  { ap:'Hoffman',      nom:'Nicolas',  v:['', 'P','P', 'P','P','P', 'A', 'A','P', 'P', 'P', 'P', 'P'  ]},
  // Kosoy Matias: 0% — sin registros
  { ap:'Kuschnir',    nom:'Joaquin',  v:['', 'P','P', 'P','A','P', 'P', 'P','P', 'A', 'P', 'P', 'A'  ]},
  { ap:'Lekier',       nom:'Delfina',  v:['P','P','P','P','P', 'P', 'P', 'P','P', 'P', 'P', 'P', 'A'  ]},
  { ap:'Low',          nom:'Federico', v:['P','P','P','P','P', 'P', 'A', 'P','P', 'T', 'P', 'T', 'P'  ]},
  { ap:'Milstein',     nom:'Theo',     v:['P','P','P','A','A', 'A', 'PT','A','T', 'A', 'A', 'PT','A'   ]},
  { ap:'Mina',         nom:'Delfina',  v:['', 'P','P', 'V','V','P', 'P', 'P','P', 'P', 'P', 'AJ','PT' ]},
  { ap:'Naccas',       nom:'Julieta',  v:['P','P','P','A','A', 'T', 'P', 'P','P', 'T', 'P', 'P', 'P'  ]},
  { ap:'Romano',       nom:'Benjamin', v:['P','P','PT','P','A','P', 'P', 'T','T', 'P', 'P', 'P', 'P'  ]},
  { ap:'Saadia',       nom:'Manuel',   v:['', 'P','P', 'P','P','P', 'P', 'P','T', 'P', 'P', 'P', 'P'  ]},
  { ap:'Satz',         nom:'Lucia',    v:['P','P','A','V','V', 'A', 'P', 'P','P', 'T', 'P', 'P', 'P'  ]},
  { ap:'Sedler',       nom:'Sofia',    v:['P','P','P','PT','P','P', 'P', 'A','P', 'T', 'A', 'PT','P'   ]},
  { ap:'Siseles',      nom:'Ana',      v:['P','P','P','P','P', 'P', 'P', 'A','P', 'P', 'P', 'PT','P'   ]},
  { ap:'Skornik',      nom:'Naomi',    v:['', 'P','P', 'V','P','P', 'V', 'V','V', 'P', 'P', 'P', 'T'  ]},
  { ap:'Smolkin',      nom:'Mila',     v:['P','P','P','P','A', 'P', 'P', 'P','A', 'T', 'P', 'A', 'P'  ]},
  // Stupnik Luli y Rami: sin datos suficientes
]

async function main() {
  console.log('🌱 Seed clases 2026 (Bet)...')

  // 1. Docentes
  await prisma.docente.createMany({ data: DOCENTES, skipDuplicates: true })
  console.log('✓ Docentes')

  // 2. Kita Bet
  const kitaBet = await prisma.kita.findFirstOrThrow({ where: { nombre: 'bet' } })
  const talmidim = await prisma.talmid.findMany({
    where: { kitaId: kitaBet.id, activo: true },
    select: { id: true, nombre: true, apellido: true },
  })
  console.log(`✓ ${talmidim.length} talmidim en Bet`)

  // 3. Clases
  await prisma.clase.createMany({
    data: CLASES.map(c => ({
      id: c.id,
      fecha: c.fecha,
      diaSemana: c.dia,
      horaInicio: c.ini,
      horaFin: c.fin,
      titulo: null,
      tipo: 'clase',
      cancelada: false,
    })),
    skipDuplicates: true,
  })
  await prisma.claseKita.createMany({
    data: CLASES.map(c => ({ claseId: c.id, kitaId: kitaBet.id })),
    skipDuplicates: true,
  })
  await prisma.claseDocente.createMany({
    data: CLASES.flatMap(c => DOCENTES.map(d => ({ claseId: c.id, docenteId: d.id }))),
    skipDuplicates: true,
  })
  console.log('✓ Clases, kitas y docentes vinculados')

  // 4. Asistencias — borrar todo lo pasado y reinsertar desde excel
  const clasesPasadasIds = CLASES.filter(c => PASADA(c.fecha)).map(c => c.id)
  await prisma.asistencia.deleteMany({ where: { claseId: { in: clasesPasadasIds } } })

  const registros: { talmidId: string; claseId: string; estado: string }[] = []

  // IDs de clases cubiertas por columnas del excel (índices 1–12)
  const cubiertosPorExcel = new Set(Object.values(IDX_A_CLASES).flat())
  // Clases pasadas NO cubiertas por excel → marcar presente a todos
  const noEnExcel = clasesPasadasIds.filter(id => !cubiertosPorExcel.has(id))

  for (const row of EXCEL) {
    const talmid = talmidim.find(t =>
      t.apellido.toLowerCase() === row.ap.toLowerCase() &&
      t.nombre.toLowerCase().startsWith(row.nom.toLowerCase())
    )
    if (!talmid) {
      console.warn(`  ⚠ No encontrado: ${row.ap} ${row.nom}`)
      continue
    }

    // Columnas del excel [1]–[12]
    for (let i = 1; i <= 12; i++) {
      const val = row.v[i]
      if (!val) continue // celda vacía → no crear registro
      const estado = MAP[val]
      if (!estado) continue
      const claseIds = IDX_A_CLASES[i]
      for (const claseId of claseIds) {
        registros.push({ talmidId: talmid.id, claseId, estado })
      }
    }

    // Clases pasadas sin columna en excel (15/05, 23/05, 05/06) → presente
    for (const claseId of noEnExcel) {
      registros.push({ talmidId: talmid.id, claseId, estado: 'presente' })
    }
  }

  await prisma.asistencia.createMany({ data: registros, skipDuplicates: true })
  console.log(`✓ ${registros.length} asistencias insertadas`)
  console.log('\n✅ Listo.')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
