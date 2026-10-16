'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'

interface ClasePendiente {
  id: string
  fecha: string
  titulo: string | null
  docentes: { nombre: string; apellido: string }[]
}

export default function FeedbackPage() {
  const [clases, setClases] = useState<ClasePendiente[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(data => setClases(data.clasesPendientes || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-lg">Feedback pendiente</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {clases.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm mt-4">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-gray-600">{t('home.pendingClasses.empty')}</p>
            <Link href="/historial" className="text-emerald-600 text-sm mt-2 inline-block">
              {t('home.pendingClasses.viewHistory')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {clases.map((clase) => (
              <Link
                key={clase.id}
                href={`/feedback/${clase.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {clase.titulo || t('common.class')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(clase.fecha).toLocaleDateString('es-AR', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </p>
                    {clase.docentes.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {clase.docentes.map(d => `${d.nombre} ${d.apellido}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                    {t('home.pendingClasses.pending')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
