import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    if (!session.esAdmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)

    const talmidim = await prisma.talmid.findMany({
      where: { activo: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        kitaId: true,
        kita: { select: { nombre: true } },
        asistencias: {
          where: { clase: { cancelada: false, fecha: { lte: hoy } } },
          select: { estado: true },
        },
      },
    })

    const faltasPeso: Record<string, number> = {
      ausente: 1, ausente_justificado: 1, viaje: 1, tarde: 0.5, presente_tarde: 0.25, presente: 0,
    }

    const reportes = talmidim.map(t => {
      let presentes = 0, tardes = 0, tardanzas = 0, ausentes = 0, justificados = 0, viajes = 0
      let faltas = 0
      for (const a of t.asistencias) {
        if (a.estado === 'presente') presentes++
        else if (a.estado === 'tarde') tardes++
        else if (a.estado === 'presente_tarde') tardanzas++
        else if (a.estado === 'ausente') ausentes++
        else if (a.estado === 'ausente_justificado') justificados++
        else if (a.estado === 'viaje') viajes++
        faltas += faltasPeso[a.estado] ?? 1
      }
      const total = presentes + tardes + tardanzas + ausentes + justificados + viajes
      const porcentaje = total > 0 ? Math.max(0, Math.round(((total - faltas) / total) * 100)) : null

      return {
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        kita: t.kita?.nombre ?? null,
        presentes,
        tardes,
        tardanzas,
        ausentes,
        justificados,
        viajes,
        total,
        porcentaje,
      }
    })

    return NextResponse.json({ reportes })
  } catch (error) {
    console.error('Error admin presentismos:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
