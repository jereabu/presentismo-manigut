'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
}

interface ClaseDetalle {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  cancelada: boolean
  motivo: string | null
  docentes: Docente[]
}

interface Asistencia {
  estado: string
  justificacion: string | null
}

interface FeedbackData {
  id: string
  claseRating: number
  claseComentario: string | null
  docentesFeedback: { docenteId: string; rating: number; comentario?: string }[]
  createdAt: string
}

const ESTADO_LABEL: Record<string, string> = {
  presente: 'Presente',
  tarde: 'Tarde',
  presente_tarde: 'Presente tarde',
  ausente: 'Ausente',
  ausente_justificado: 'Justificado',
  viaje: 'Viaje',
}

const ESTADO_COLOR: Record<string, string> = {
  presente: 'bg-emerald-100 text-emerald-700',
  tarde: 'bg-amber-100 text-amber-700',
  presente_tarde: 'bg-yellow-100 text-yellow-700',
  ausente: 'bg-red-100 text-red-700',
  ausente_justificado: 'bg-red-100 text-red-700',
  viaje: 'bg-sky-100 text-sky-700',
}

function StarDisplay({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={s} viewBox="0 0 24 24"
          fill={star <= value ? '#10b981' : 'none'}
          stroke={star <= value ? '#10b981' : '#d1d5db'}
          strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

export default function ClaseDetallePage() {
  const { claseId } = useParams() as { claseId: string }
  const [clase, setClase] = useState<ClaseDetalle | null>(null)
  const [asistencia, setAsistencia] = useState<Asistencia | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clase/${claseId}`)
      .then(r => r.json())
      .then(d => {
        setClase(d.clase)
        setAsistencia(d.asistencia)
        setFeedback(d.feedback)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [claseId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!clase) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <p className="text-gray-500">Clase no encontrada</p>
        <Link href="/cronograma" className="text-emerald-600 mt-2">← Volver al cronograma</Link>
      </div>
    )
  }

  const hoy = new Date().toISOString().split('T')[0]
  const esPasada = clase.fecha <= hoy
  const puededarFeedback = asistencia && ['presente', 'tarde', 'presente_tarde'].includes(asistencia.estado) && !clase.cancelada

  const fechaDisplay = (() => {
    const [y, m, d] = clase.fecha.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  })()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/cronograma" className="text-emerald-100 hover:text-white">←</Link>
          <div>
            <h1 className="font-semibold">{clase.titulo || 'Clase'}</h1>
            <p className="text-emerald-100 text-sm capitalize">{fechaDisplay}</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Info de la clase */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 capitalize">{clase.diaSemana}</p>
                <p className="font-medium text-gray-800">{clase.horaInicio}–{clase.horaFin}</p>
              </div>
              {clase.cancelada && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">Cancelada</span>
              )}
              {!esPasada && !clase.cancelada && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Próxima</span>
              )}
            </div>
            {clase.motivo && (
              <p className="text-sm text-gray-500 mt-2 italic">Motivo: {clase.motivo}</p>
            )}
          </div>

          {/* Docentes */}
          {clase.docentes.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-medium text-gray-400 uppercase mb-3">Docentes</p>
              <div className="space-y-2">
                {clase.docentes.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                      {d.nombre[0]}{d.apellido[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.nombre} {d.apellido}</p>
                      <p className="text-xs text-gray-400 capitalize">{d.tipo}</p>
                    </div>
                    {/* Rating del docente en el feedback */}
                    {feedback && (() => {
                      const df = feedback.docentesFeedback.find(x => x.docenteId === d.id)
                      return df && df.rating > 0 ? (
                        <div className="ml-auto">
                          <StarDisplay value={df.rating} size="sm" />
                        </div>
                      ) : null
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mi asistencia */}
        {esPasada && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Mi asistencia</p>
            {asistencia ? (
              <div>
                <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${ESTADO_COLOR[asistencia.estado] || 'bg-gray-100 text-gray-600'}`}>
                  {ESTADO_LABEL[asistencia.estado] || asistencia.estado}
                </span>
                {asistencia.justificacion && (
                  <p className="text-sm text-gray-500 mt-2 italic">{asistencia.justificacion}</p>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Sin registro</span>
            )}
          </div>
        )}

        {/* Mi feedback */}
        {feedback && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Mi feedback</p>
              {puededarFeedback && (
                <Link href={`/feedback/${claseId}`} className="text-xs text-emerald-600 hover:underline">
                  Editar
                </Link>
              )}
            </div>
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Clase</p>
              <StarDisplay value={feedback.claseRating} />
              {feedback.claseComentario && (
                <p className="text-sm text-gray-600 mt-2 italic">&ldquo;{feedback.claseComentario}&rdquo;</p>
              )}
            </div>
          </div>
        )}

        {/* CTA feedback */}
        {puededarFeedback && !feedback && (
          <Link
            href={`/feedback/${claseId}`}
            className="block w-full bg-emerald-600 text-white text-center py-4 rounded-2xl font-medium hover:bg-emerald-700 transition shadow-sm"
          >
            Dar feedback de esta clase
          </Link>
        )}
      </main>
    </div>
  )
}
