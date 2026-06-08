'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Feriado {
  id: string
  fecha: string
  nombre: string
  tipo: string
}

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newFeriado, setNewFeriado] = useState({ fecha: '', nombre: '', tipo: 'manual' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'argentino' | 'judio' | 'manual'>('todos')
  const [seeding, setSeeding] = useState(false)
  const t = useTranslations()

  const handleSeedFeriados = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/feriados/seed', { method: 'POST' })
      if (res.ok) {
        await fetchFeriados()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    fetchFeriados()
  }, [])

  const fetchFeriados = async () => {
    try {
      const res = await fetch('/api/feriados')
      const json = await res.json()
      setFeriados(json.feriados)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/feriados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeriado),
      })

      if (res.ok) {
        setNewFeriado({ fecha: '', nombre: '', tipo: 'manual' })
        setShowForm(false)
        fetchFeriados()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('feriados.confirmDelete'))) return

    try {
      await fetch('/api/feriados', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchFeriados()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'argentino':
        return 'bg-blue-100 text-blue-700'
      case 'judio':
        return 'bg-purple-100 text-purple-700'
      case 'manual':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filteredFeriados = feriados.filter(
    (f) => filter === 'todos' || f.tipo === filter
  )

  // Agrupar por mes
  const feriadosPorMes = filteredFeriados.reduce((acc, feriado) => {
    const [year, month] = feriado.fecha.split('-')
    const key = `${year}-${month}`
    if (!acc[key]) acc[key] = []
    acc[key].push(feriado)
    return acc
  }, {} as Record<string, Feriado[]>)

  const formatMes = (key: string) => {
    const [year, month] = key.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const getFilterLabel = (tipo: string) => {
    switch (tipo) {
      case 'todos':
        return t('feriados.filters.all')
      case 'argentino':
        return t('feriados.filters.argentino')
      case 'judio':
        return t('feriados.filters.judio')
      case 'manual':
        return t('feriados.filters.manual')
      default:
        return tipo
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('feriados.title')}</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-blue-200 hover:text-white text-2xl"
            >
              {showForm ? '×' : '+'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Seed button — solo si no hay feriados cargados */}
        {!loading && feriados.filter(f => f.tipo !== 'manual').length === 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-blue-700">No hay feriados cargados para 2026.</p>
            <button
              onClick={handleSeedFeriados}
              disabled={seeding}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {seeding ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cargando...</>
              ) : '📅 Cargar feriados 2026'}
            </button>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">{t('feriados.form.title')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('feriados.form.date')}
                </label>
                <input
                  type="date"
                  value={newFeriado.fecha}
                  onChange={(e) => setNewFeriado({ ...newFeriado, fecha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('feriados.form.reason')}
                </label>
                <input
                  type="text"
                  value={newFeriado.nombre}
                  onChange={(e) => setNewFeriado({ ...newFeriado, nombre: e.target.value })}
                  placeholder={t('feriados.form.reasonPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('feriados.form.type')}
                </label>
                <select
                  value={newFeriado.tipo}
                  onChange={(e) => setNewFeriado({ ...newFeriado, tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="manual">{t('feriados.form.types.manual')}</option>
                  <option value="argentino">{t('feriados.form.types.argentino')}</option>
                  <option value="judio">{t('feriados.form.types.judio')}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saving ? t('common.saving') : t('common.add')}
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['todos', 'argentino', 'judio', 'manual'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFilter(tipo)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === tipo
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getFilterLabel(tipo)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(feriadosPorMes).map(([mes, feriadosMes]) => (
              <div key={mes}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 capitalize">
                  {formatMes(mes)}
                </h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {feriadosMes.map((feriado) => (
                    <div
                      key={feriado.id}
                      className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-400 w-11 shrink-0">
                          {feriado.fecha.slice(8)}/{feriado.fecha.slice(5, 7)}
                        </span>
                        <span className="text-sm text-gray-800">{feriado.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(feriado.tipo)}`}>
                          {feriado.tipo}
                        </span>
                        {feriado.tipo === 'manual' && (
                          <button
                            onClick={() => handleDelete(feriado.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title={t('common.delete')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredFeriados.length === 0 && (
              <div className="text-center text-gray-500 py-8 space-y-4">
                <p>{t('feriados.empty')}</p>
                {feriados.length === 0 && (
                  <button
                    onClick={handleSeedFeriados}
                    disabled={seeding}
                    className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:opacity-50"
                  >
                    {seeding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      '📅 Cargar feriados 2026'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  )
}
