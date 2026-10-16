'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'

export default function HomePage() {
  const [pendienteCount, setPendienteCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [talmid, setTalmid] = useState<{ nombre: string; apellido: string; fotoUrl?: string | null; esAdmin?: boolean } | null>(null)
  const t = useTranslations()

  useEffect(() => {
    async function fetchData() {
      try {
        const [feedbackRes, perfilRes] = await Promise.all([
          fetch('/api/feedback'),
          fetch('/api/perfil'),
        ])
        if (feedbackRes.ok) {
          const data = await feedbackRes.json()
          setPendienteCount((data.clasesPendientes || []).length)
          setTalmid(prev => ({ ...prev, ...data.talmid }))
        }
        if (perfilRes.ok) {
          const perfilData = await perfilRes.json()
          if (perfilData.talmid) {
            setTalmid(prev => prev ? { ...prev, fotoUrl: perfilData.talmid.fotoUrl } : perfilData.talmid)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/perfil">
              {talmid?.fotoUrl ? (
                <img
                  src={talmid.fotoUrl}
                  alt="Foto"
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 hover:border-white transition"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-emerald-400 hover:border-white transition flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {talmid ? `${talmid.nombre[0]}${talmid.apellido[0]}` : '?'}
                  </span>
                </div>
              )}
            </Link>
            <div>
              <h1 className="text-xl font-bold">{t('app.name')}</h1>
              {talmid && (
                <p className="text-emerald-100 text-sm">{t('home.greeting', { name: talmid.nombre })}</p>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="text-emerald-100 hover:text-white text-sm">
            {t('common.logout')}
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Acceso admin */}
        {talmid?.esAdmin && (
          <Link
            href="/admin/presentismos"
            className="flex items-center gap-3 bg-emerald-600 text-white rounded-xl p-4 shadow-md hover:bg-emerald-700 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold">Ver todos los presentismos</p>
              <p className="text-emerald-100 text-sm">Acceso admin</p>
            </div>
            <span className="ml-auto text-emerald-200">→</span>
          </Link>
        )}

        {/* Grilla de accesos */}
        <div className="grid grid-cols-2 gap-3">
          {/* Feedback — badge si hay pendientes */}
          <Link
            href="/feedback"
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col items-center gap-2"
          >
            {pendienteCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendienteCount}
              </span>
            )}
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Feedback</span>
          </Link>

          {/* Presentismo */}
          <Link
            href="/presentismo"
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Mi asistencia</span>
          </Link>

          {/* Cronograma */}
          <Link
            href="/cronograma"
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Cronograma</span>
          </Link>

          {/* Historial feedback */}
          <Link
            href="/historial"
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Mis feedbacks</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
