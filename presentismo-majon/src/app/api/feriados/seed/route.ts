import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

function f(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

const FERIADOS_2026 = [
  // Argentinos
  { fecha: f(2026,1,1),   nombre: 'Año Nuevo',                                    tipo: 'argentino' },
  { fecha: f(2026,2,16),  nombre: 'Carnaval',                                     tipo: 'argentino' },
  { fecha: f(2026,2,17),  nombre: 'Carnaval',                                     tipo: 'argentino' },
  { fecha: f(2026,3,23),  nombre: 'Día Nacional de la Memoria',                   tipo: 'argentino' },
  { fecha: f(2026,4,2),   nombre: 'Día del Veterano y los Caídos en Malvinas',    tipo: 'argentino' },
  { fecha: f(2026,4,3),   nombre: 'Viernes Santo',                                tipo: 'argentino' },
  { fecha: f(2026,5,1),   nombre: 'Día del Trabajador',                           tipo: 'argentino' },
  { fecha: f(2026,5,25),  nombre: 'Día de la Revolución de Mayo',                 tipo: 'argentino' },
  { fecha: f(2026,6,15),  nombre: 'Paso a la Inmortalidad del Gral. Belgrano',    tipo: 'argentino' },
  { fecha: f(2026,7,9),   nombre: 'Día de la Independencia',                      tipo: 'argentino' },
  { fecha: f(2026,8,17),  nombre: 'Paso a la Inmortalidad del Gral. San Martín',  tipo: 'argentino' },
  { fecha: f(2026,10,12), nombre: 'Día del Respeto a la Diversidad Cultural',     tipo: 'argentino' },
  { fecha: f(2026,11,20), nombre: 'Día de la Soberanía Nacional',                 tipo: 'argentino' },
  { fecha: f(2026,12,8),  nombre: 'Inmaculada Concepción de María',               tipo: 'argentino' },
  { fecha: f(2026,12,25), nombre: 'Navidad',                                      tipo: 'argentino' },

  // Judíos
  { fecha: f(2026,3,3),   nombre: 'Purim (Taanit Ester)',       tipo: 'judio' },
  { fecha: f(2026,3,4),   nombre: 'Purim',                      tipo: 'judio' },
  { fecha: f(2026,3,5),   nombre: 'Shushan Purim',              tipo: 'judio' },
  { fecha: f(2026,4,1),   nombre: 'Erev Pesaj',                 tipo: 'judio' },
  { fecha: f(2026,4,2),   nombre: 'Pesaj (1° día)',             tipo: 'judio' },
  { fecha: f(2026,4,3),   nombre: 'Pesaj (2° día)',             tipo: 'judio' },
  { fecha: f(2026,4,7),   nombre: 'Pesaj (7° día)',             tipo: 'judio' },
  { fecha: f(2026,4,8),   nombre: 'Pesaj (8° día)',             tipo: 'judio' },
  { fecha: f(2026,4,23),  nombre: 'Yom HaShoá',                 tipo: 'judio' },
  { fecha: f(2026,4,30),  nombre: 'Yom HaZikarón',              tipo: 'judio' },
  { fecha: f(2026,5,1),   nombre: 'Yom HaAtzmaut',              tipo: 'judio' },
  { fecha: f(2026,5,16),  nombre: 'Lag BaOmer',                 tipo: 'judio' },
  { fecha: f(2026,5,26),  nombre: 'Yom Yerushalaim',            tipo: 'judio' },
  { fecha: f(2026,5,20),  nombre: 'Erev Shavuot',               tipo: 'judio' },
  { fecha: f(2026,5,21),  nombre: 'Shavuot (1° día)',           tipo: 'judio' },
  { fecha: f(2026,5,22),  nombre: 'Shavuot (2° día)',           tipo: 'judio' },
  { fecha: f(2026,7,12),  nombre: 'Tzom 17 de Tamuz',           tipo: 'judio' },
  { fecha: f(2026,8,2),   nombre: "Tishá Be'Av",                tipo: 'judio' },
  { fecha: f(2026,9,10),  nombre: 'Erev Rosh Hashaná',          tipo: 'judio' },
  { fecha: f(2026,9,11),  nombre: 'Rosh Hashaná (1° día)',      tipo: 'judio' },
  { fecha: f(2026,9,12),  nombre: 'Rosh Hashaná (2° día)',      tipo: 'judio' },
  { fecha: f(2026,9,13),  nombre: 'Tzom Guedaliá',              tipo: 'judio' },
  { fecha: f(2026,9,19),  nombre: 'Erev Yom Kipur',             tipo: 'judio' },
  { fecha: f(2026,9,20),  nombre: 'Yom Kipur',                  tipo: 'judio' },
  { fecha: f(2026,9,24),  nombre: 'Erev Sucot',                 tipo: 'judio' },
  { fecha: f(2026,9,25),  nombre: 'Sucot (1° día)',             tipo: 'judio' },
  { fecha: f(2026,9,26),  nombre: 'Sucot (2° día)',             tipo: 'judio' },
  { fecha: f(2026,10,1),  nombre: 'Hoshana Rabá',               tipo: 'judio' },
  { fecha: f(2026,10,2),  nombre: 'Shminí Atzéret / Simjat Torá', tipo: 'judio' },
  { fecha: f(2026,12,14), nombre: 'Janucá (1° día)',            tipo: 'judio' },
  { fecha: f(2026,12,15), nombre: 'Janucá (2° día)',            tipo: 'judio' },
  { fecha: f(2026,12,16), nombre: 'Janucá (3° día)',            tipo: 'judio' },
  { fecha: f(2026,12,17), nombre: 'Janucá (4° día)',            tipo: 'judio' },
  { fecha: f(2026,12,18), nombre: 'Janucá (5° día)',            tipo: 'judio' },
  { fecha: f(2026,12,19), nombre: 'Janucá (6° día)',            tipo: 'judio' },
  { fecha: f(2026,12,20), nombre: 'Janucá (7° día)',            tipo: 'judio' },
  { fecha: f(2026,12,21), nombre: 'Janucá (8° día)',            tipo: 'judio' },
]

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Borrar existentes (argentino y judio) y reinsertar
    await prisma.feriado.deleteMany({ where: { tipo: { in: ['argentino', 'judio'] } } })
    await prisma.feriado.createMany({ data: FERIADOS_2026, skipDuplicates: true })

    return NextResponse.json({ success: true, count: FERIADOS_2026.length })
  } catch (error) {
    console.error('Error seeding feriados:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
