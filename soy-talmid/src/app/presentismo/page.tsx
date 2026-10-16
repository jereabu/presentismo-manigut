'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Registro {
  fecha: string
  diaSemana: string
  titulo: string | null
  estado: string
}

interface PresentismoData {
  porcentaje: number
  total: number
  totales: {
    presentes: number
    tardes: number
    presenteTarde: number
    ausentes: number
    justificados: number
    viajes: number
  }
  registros: Registro[]
}

const ESTADO_LABEL: Record<string, string> = {
  presente: 'P',
  tarde: 'T',
  presente_tarde: 'PT',
  ausente: 'A',
  ausente_justificado: 'AJ',
  viaje: 'V',
}

const ESTADO_COLOR: Record<string, string> = {
  presente: 'bg-green-100 text-green-700',
  tarde: 'bg-amber-100 text-amber-700',
  presente_tarde: 'bg-yellow-100 text-yellow-700',
  ausente: 'bg-red-100 text-red-700',
  ausente_justificado: 'bg-orange-100 text-orange-700',
  viaje: 'bg-blue-100 text-blue-700',
}

function fmtFecha(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

export default function PresentismoPage() {
  const [data, setData] = useState<PresentismoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/presentismo')
      .then(r => r.json())
      .then(setData)
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

  const pct = data?.porcentaje ?? 0
  const pctColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-lg">Mi asistencia</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Resumen */}
        {data && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className={`text-5xl font-bold ${pctColor}`}>{pct}%</div>
              <div className="text-gray-500 text-sm mt-1">de asistencia ({data.total} clases)</div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-600">{data.totales.presentes}</div>
                  <div className="text-gray-500">Presentes</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-amber-600">{data.totales.tardes + data.totales.presenteTarde}</div>
                  <div className="text-gray-500">Tardanzas</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-red-600">{data.totales.ausentes + data.totales.justificados}</div>
                  <div className="text-gray-500">Ausentes</div>
                </div>
              </div>
            </div>

            {/* Historial de clases */}
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {data.registros.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay registros todavía</div>
              ) : (
                data.registros.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{fmtFecha(r.fecha)}</div>
                      {r.titulo && <div className="text-xs text-gray-400">{r.titulo}</div>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[r.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ESTADO_LABEL[r.estado] ?? r.estado}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
