import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ claseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { claseId } = await params

    const [clase, asistencia, feedback] = await Promise.all([
      prisma.clase.findUnique({
        where: { id: claseId },
        include: {
          docentes: {
            include: { docente: { select: { id: true, nombre: true, apellido: true, tipo: true } } }
          }
        }
      }),
      prisma.asistencia.findFirst({
        where: { talmidId: session.talmidId, claseId },
        select: { estado: true, justificacion: true }
      }),
      prisma.feedback.findUnique({
        where: { talmidId_claseId: { talmidId: session.talmidId, claseId } },
        select: { id: true, claseRating: true, claseComentario: true, docentesFeedback: true, createdAt: true }
      }),
    ])

    if (!clase) return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })

    return NextResponse.json({
      clase: {
        id: clase.id,
        fecha: clase.fecha.toISOString().split('T')[0],
        diaSemana: clase.diaSemana,
        horaInicio: clase.horaInicio,
        horaFin: clase.horaFin,
        titulo: clase.titulo,
        cancelada: clase.cancelada,
        motivo: clase.motivo,
        docentes: clase.docentes.map((cd: { docente: { id: string; nombre: string; apellido: string; tipo: string } }) => ({
          id: cd.docente.id,
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo,
        }))
      },
      asistencia: asistencia ?? null,
      feedback: feedback ? {
        id: feedback.id,
        claseRating: feedback.claseRating,
        claseComentario: feedback.claseComentario,
        docentesFeedback: feedback.docentesFeedback ? JSON.parse(feedback.docentesFeedback) : [],
        createdAt: feedback.createdAt.toISOString(),
      } : null,
    })
  } catch (error) {
    console.error('Error fetching clase detail:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
