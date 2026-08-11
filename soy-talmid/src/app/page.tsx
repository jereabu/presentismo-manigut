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

export default function HomePage() {
  const [clasesPendientes, setClasesPendientes] = useState<ClasePendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [talmid, setTalmid] = useState<{ nombre: string; apellido: string; fotoUrl?: string | null; esAdmin?: boolean } | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    fetchData()
    checkNotificationPermission()
  }, [])

  async function fetchData() {
    try {
      const [feedbackRes, perfilRes] = await Promise.all([
        fetch('/api/feedback'),
        fetch('/api/perfil'),
      ])
      if (feedbackRes.ok) {
        const data = await feedbackRes.json()
        setClasesPendientes(data.clasesPendientes || [])
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

  function checkNotificationPermission() {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }

  async function handleEnableNotifications() {
    if (!('Notification' in window)) {
      alert(t('home.notifications.notSupported'))
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      try {
        const registration = await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          alert(t('home.notifications.enabled'))
          return
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
        if (res.ok) {
          alert(t('home.notifications.enabled'))
        }
      } catch (error) {
        console.error('Error subscribing:', error)
      }
    }
  }

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
          <button
            onClick={handleLogout}
            className="text-emerald-100 hover:text-white text-sm"
          >
            {t('common.logout')}
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Acceso admin */}
        {talmid?.esAdmin && (
          <Link
            href="/admin/presentismos"
            className="flex items-center gap-3 bg-emerald-600 text-white rounded-xl p-4 mb-5 shadow-md hover:bg-emerald-700 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold">Ver todos los presentismos</p>
              <p className="text-emerald-100 text-sm">Acceso admin</p>
            </div>
            <span className="ml-auto text-emerald-200">→</span>
          </Link>
        )}

        {/* Banner de notificaciones */}
        {!notificationsEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm mb-2">
              {t('home.notifications.banner')}
            </p>
            <button
              onClick={handleEnableNotifications}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              {t('home.notifications.enable')}
            </button>
          </div>
        )}

        {/* Clases pendientes de feedback */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('home.pendingClasses.title')}
          </h2>

          {clasesPendientes.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-600">{t('home.pendingClasses.empty')}</p>
              <Link href="/historial" className="text-emerald-600 text-sm mt-2 inline-block">
                {t('home.pendingClasses.viewHistory')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {clasesPendientes.map((clase) => (
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
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
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
        </section>

        {/* Accesos rápidos */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/cronograma"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Cronograma</span>
          </Link>
          <Link
            href="/historial"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Historial</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
