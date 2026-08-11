'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Reporte {
  id: string
  nombre: string
  apellido: string
  kita: string | null
  presentes: number
  tardes: number
  tardanzas: number
  ausentes: number
  justificados: number
  viajes: number
  total: number
  porcentaje: number | null
}

export default function AdminPresentismosPage() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroKita, setFiltroKita] = useState<string>('todas')

  useEffect(() => {
    fetch('/api/admin/presentismos')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setReportes(d.reportes || [])
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const kitas = Array.from(new Set(reportes.map(r => r.kita).filter(Boolean))) as string[]
  const filtrados = filtroKita === 'todas' ? reportes : reportes.filter(r => r.kita === filtroKita)

  const colorPct = (p: number | null) => {
    if (p === null) return 'text-gray-400'
    if (p >= 75) return 'text-emerald-600'
    if (p >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const bgPct = (p: number | null) => {
    if (p === null) return 'bg-gray-50'
    if (p >= 75) return 'bg-emerald-50'
    if (p >= 60) return 'bg-amber-50'
    return 'bg-red-50'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-10">
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-100 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">Presentismos</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-12">{error}</p>
        ) : (
          <>
            {kitas.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setFiltroKita('todas')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium shrink-0 ${filtroKita === 'todas' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                >
                  Todas
                </button>
                {kitas.map(k => (
                  <button
                    key={k}
                    onClick={() => setFiltroKita(k)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shrink-0 ${filtroKita === k ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {filtrados.map(r => (
                <div key={r.id} className={`rounded-2xl p-4 shadow-sm border border-gray-100 ${bgPct(r.porcentaje)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{r.apellido}, {r.nombre}</p>
                      {r.kita && <p className="text-xs text-gray-400">{r.kita}</p>}
                    </div>
                    <span className={`text-2xl font-bold ${colorPct(r.porcentaje)}`}>
                      {r.porcentaje !== null ? `${r.porcentaje}%` : '—'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="text-emerald-600 font-medium">P: {r.presentes}</span>
                    {r.tardes > 0 && <span className="text-amber-500 font-medium">T: {r.tardes}</span>}
                    {r.tardanzas > 0 && <span className="text-amber-400 font-medium">PT: {r.tardanzas}</span>}
                    {r.ausentes > 0 && <span className="text-red-500 font-medium">A: {r.ausentes}</span>}
                    {r.justificados > 0 && <span className="text-orange-400 font-medium">AJ: {r.justificados}</span>}
                    {r.viajes > 0 && <span className="text-sky-500 font-medium">V: {r.viajes}</span>}
                    <span className="ml-auto text-gray-400">{r.total} clases</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
