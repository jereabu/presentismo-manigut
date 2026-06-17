'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface DocenteRanking {
  id: string
  nombre: string
  apellido: string
  promedio: number
  cantidadFeedbacks: number
}

interface FeedbackReciente {
  id: string
  claseRating: number
  claseComentario: string | null
  createdAt: string
  talmid: { nombre: string; apellido: string }
  clase: { fecha: string; titulo: string | null }
  docentesFeedback: Array<{ docenteId: string; rating: number; comentario?: string }>
}

interface TalmidFeedback {
  id: string
  nombre: string
  apellido: string
  claseRating: number
  claseComentario: string | null
  docentesFeedback: Array<{ docenteId: string; rating: number; comentario?: string }>
}

interface ClaseFeedback {
  claseId: string
  fecha: string
  titulo: string | null
  talmidim: TalmidFeedback[]
}

interface Stats {
  totalFeedbacks: number
  promedioClase: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-500' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

function FeedbackPorFechaModal({
  clase,
  onClose,
}: {
  clase: ClaseFeedback
  onClose: () => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fecha = new Date(clase.fecha + 'T12:00:00')
  const fechaLabel = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-pink-500 font-medium uppercase tracking-wide">Feedback</p>
              <h2 className="text-lg font-bold text-gray-900 capitalize">{fechaLabel}</h2>
              {clase.titulo && <p className="text-sm text-gray-500">{clase.titulo}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {clase.talmidim.length} talmidim enviaron feedback
          </p>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {clase.talmidim.map(t => (
            <div key={t.id} className="rounded-2xl overflow-hidden border border-gray-100">
              {/* Talmid row */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-left"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-sm">
                    {t.apellido[0]}
                  </div>
                  <span className="font-medium text-gray-800">
                    {t.apellido}, {t.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {t.claseRating > 0 && (
                    <span className="text-sm font-bold text-pink-600">{t.claseRating}★</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded feedback */}
              {expandedId === t.id && (
                <div className="bg-gray-50 px-4 py-3 space-y-3 border-t border-gray-100">
                  {/* Rating clase */}
                  {t.claseRating > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Clase</p>
                      <StarRating rating={t.claseRating} />
                    </div>
                  )}

                  {/* Comentario clase */}
                  {t.claseComentario && t.claseComentario.trim() && (
                    <p className="text-sm text-gray-700 italic bg-white rounded-xl p-3 border border-gray-100">
                      &ldquo;{t.claseComentario.trim()}&rdquo;
                    </p>
                  )}

                  {/* Docentes */}
                  {t.docentesFeedback.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Docentes</p>
                      {t.docentesFeedback.map((df, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                          {df.rating > 0 && <StarRating rating={df.rating} />}
                          {df.comentario && df.comentario.trim() && (
                            <p className="text-sm text-gray-600 italic mt-1">&ldquo;{df.comentario.trim()}&rdquo;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sin contenido real */}
                  {t.claseRating === 0 && (!t.claseComentario || !t.claseComentario.trim()) && (
                    <p className="text-sm text-gray-400 italic">Sin comentarios</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [docentesRanking, setDocentesRanking] = useState<DocenteRanking[]>([])
  const [feedbacksRecientes, setFeedbacksRecientes] = useState<FeedbackReciente[]>([])
  const [porFecha, setPorFecha] = useState<ClaseFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClase, setSelectedClase] = useState<ClaseFeedback | null>(null)
  const t = useTranslations()

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setDocentesRanking(data.docentesRanking || [])
        setFeedbacksRecientes(data.feedbacksRecientes || [])
        setPorFecha(data.porFecha || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-pink-800 to-pink-700">
      {/* Header */}
      <header className="pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back').replace('← ', '')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('feedback.title')}</h1>
          <p className="text-pink-200">{t('feedback.subtitle')}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats generales */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <p className="text-3xl font-bold text-pink-600">{stats.totalFeedbacks}</p>
              <p className="text-gray-500 text-sm">{t('feedback.stats.total')}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl font-bold text-pink-600">{stats.promedioClase}</p>
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">{t('feedback.stats.classAverage')}</p>
            </div>
          </div>
        )}

        {/* Feedback por fecha */}
        {porFecha.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Por clase
            </h2>
            <div className="flex flex-wrap gap-2">
              {porFecha.map(clase => {
                const fecha = new Date(clase.fecha + 'T12:00:00')
                const dia = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                return (
                  <button
                    key={clase.claseId}
                    onClick={() => setSelectedClase(clase)}
                    className="flex flex-col items-center bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-2xl px-4 py-2.5 transition"
                  >
                    <span className="text-sm font-bold text-pink-700">{dia}</span>
                    <span className="text-xs text-pink-400">{clase.talmidim.length} resp.</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Ranking de docentes */}
        {docentesRanking.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {t('feedback.ranking.title')}
            </h2>
            <div className="space-y-3">
              {docentesRanking.map((docente, index) => (
                <Link
                  key={docente.id}
                  href={`/docentes/${docente.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-600' :
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {docente.nombre} {docente.apellido}
                    </p>
                    <p className="text-xs text-gray-500">
                      {docente.cantidadFeedbacks} {t('feedback.ranking.evaluations')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
                    <span className="font-bold text-pink-600">{docente.promedio}</span>
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedbacks recientes */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {t('feedback.recent.title')}
          </h2>

          {feedbacksRecientes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500">{t('feedback.recent.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacksRecientes.map((feedback) => (
                <div key={feedback.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {feedback.talmid.nombre} {feedback.talmid.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {feedback.clase.titulo || t('cronograma.class')} - {new Date(feedback.clase.fecha).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-lg">
                      <span className="font-bold text-pink-600 text-sm">{feedback.claseRating}</span>
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  {feedback.claseComentario && (
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">
                      &ldquo;{feedback.claseComentario}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal por fecha */}
      {selectedClase && (
        <FeedbackPorFechaModal
          clase={selectedClase}
          onClose={() => setSelectedClase(null)}
        />
      )}
    </div>
  )
}
