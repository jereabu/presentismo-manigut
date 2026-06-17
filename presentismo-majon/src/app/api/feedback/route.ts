import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener todos los feedbacks con datos relacionados
    const feedbacks = await prisma.feedback.findMany({
      include: {
        talmid: {
          select: { id: true, nombre: true, apellido: true }
        },
        clase: {
          select: {
            id: true,
            fecha: true,
            titulo: true,
            docentes: {
              include: {
                docente: {
                  select: { id: true, nombre: true, apellido: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estadísticas por docente
    const docenteStats: Record<string, {
      nombre: string
      apellido: string
      totalRatings: number
      sumRatings: number
      feedbackCount: number
    }> = {}

    // Estadísticas generales de clases
    let totalClaseRating = 0
    let claseRatingCount = 0

    for (const feedback of feedbacks) {
      // Solo contar ratings reales (no los feedbacks vacíos sembrados)
      if (feedback.claseRating === 0) continue
      totalClaseRating += feedback.claseRating
      claseRatingCount++

      // Procesar feedback de docentes
      if (feedback.docentesFeedback) {
        try {
          const docentesFeedback = JSON.parse(feedback.docentesFeedback) as Array<{
            docenteId: string
            rating: number
            comentario?: string
          }>

          for (const df of docentesFeedback) {
            if (!docenteStats[df.docenteId]) {
              // Buscar nombre del docente
              const docente = feedback.clase.docentes.find(
                cd => cd.docente.id === df.docenteId
              )?.docente

              if (docente) {
                docenteStats[df.docenteId] = {
                  nombre: docente.nombre,
                  apellido: docente.apellido,
                  totalRatings: 0,
                  sumRatings: 0,
                  feedbackCount: 0
                }
              }
            }

            if (docenteStats[df.docenteId] && df.rating > 0) {
              docenteStats[df.docenteId].totalRatings++
              docenteStats[df.docenteId].sumRatings += df.rating
              docenteStats[df.docenteId].feedbackCount++
            }
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }

    // Convertir stats de docentes a array con promedios
    const docentesRanking = Object.entries(docenteStats)
      .map(([id, stats]) => ({
        id,
        nombre: stats.nombre,
        apellido: stats.apellido,
        promedio: stats.totalRatings > 0
          ? Math.round((stats.sumRatings / stats.totalRatings) * 10) / 10
          : 0,
        cantidadFeedbacks: stats.feedbackCount
      }))
      .filter(d => d.cantidadFeedbacks > 0)
      .sort((a, b) => b.promedio - a.promedio)

    // Agrupar feedbacks por clase/fecha (excluir feedbacks vacíos: rating=0 y sin comentario real)
    const feedbacksReales = feedbacks.filter(
      f => f.claseRating > 0 || (f.claseComentario && f.claseComentario.trim().length > 0)
    )

    const claseMap = new Map<string, {
      claseId: string
      fecha: string
      titulo: string | null
      talmidim: Array<{
        id: string
        nombre: string
        apellido: string
        claseRating: number
        claseComentario: string | null
        docentesFeedback: Array<{ docenteId: string; rating: number; comentario?: string }>
      }>
    }>()

    for (const f of feedbacksReales) {
      const key = f.clase.id
      if (!claseMap.has(key)) {
        claseMap.set(key, {
          claseId: f.clase.id,
          fecha: f.clase.fecha.toISOString().split('T')[0],
          titulo: f.clase.titulo,
          talmidim: [],
        })
      }
      claseMap.get(key)!.talmidim.push({
        id: f.talmid.id,
        nombre: f.talmid.nombre,
        apellido: f.talmid.apellido,
        claseRating: f.claseRating,
        claseComentario: f.claseComentario,
        docentesFeedback: f.docentesFeedback ? JSON.parse(f.docentesFeedback) : [],
      })
    }

    // Ordenar talmidim alfabéticamente dentro de cada clase
    const porFecha = Array.from(claseMap.values())
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(c => ({
        ...c,
        talmidim: c.talmidim.sort((a, b) =>
          a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre)
        ),
      }))

    // Formatear feedbacks recientes
    const feedbacksRecientes = feedbacksReales.slice(0, 20).map(f => ({
      id: f.id,
      claseRating: f.claseRating,
      claseComentario: f.claseComentario,
      createdAt: f.createdAt.toISOString(),
      talmid: {
        nombre: f.talmid.nombre,
        apellido: f.talmid.apellido
      },
      clase: {
        fecha: f.clase.fecha.toISOString(),
        titulo: f.clase.titulo
      },
      docentesFeedback: f.docentesFeedback ? JSON.parse(f.docentesFeedback) : []
    }))

    return NextResponse.json({
      stats: {
        totalFeedbacks: feedbacksReales.length,
        promedioClase: claseRatingCount > 0
          ? Math.round((totalClaseRating / claseRatingCount) * 10) / 10
          : 0
      },
      docentesRanking,
      feedbacksRecientes,
      porFecha,
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
