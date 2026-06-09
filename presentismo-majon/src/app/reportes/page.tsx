'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Reporte {
  id: string
  nombre: string
  apellido: string
  presentes: number
  tardanzas: number
  ausentes: number
  justificados: number
  viajes: number
  totalClasesTomadas: number
  porcentajeAsistencia: number
  historial?: {
    fecha: string
    diaSemana: string
    estado: string
    justificacion: string | null
  }[]
}

interface ReportesResponse {
  totalClases: number
  reportes: Reporte[]
}

export default function ReportesPage() {
  const [data, setData] = useState<ReportesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTalmid, setSelectedTalmid] = useState<string | null>(null)
  const [historial, setHistorial] = useState<Reporte['historial'] | null>(null)
  const [exportando, setExportando] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    fetchReportes()
  }, [])

  const fetchReportes = async () => {
    try {
      const res = await fetch('/api/reportes')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistorial = async (talmidId: string) => {
    if (selectedTalmid === talmidId) {
      setSelectedTalmid(null)
      setHistorial(null)
      return
    }

    try {
      const res = await fetch(`/api/reportes?talmidId=${talmidId}`)
      const json = await res.json()
      const talmid = json.reportes.find((r: Reporte) => r.id === talmidId)
      setHistorial(talmid?.historial || [])
      setSelectedTalmid(talmidId)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleExportCSV = async () => {
    setExportando(true)
    try {
      const res = await fetch('/api/reportes/export')
      if (!res.ok) throw new Error('Error al obtener datos')
      const { clases, talmidim } = await res.json() as {
        clases: { id: string; fecha: string; diaSemana: string; titulo: string | null }[]
        talmidim: { id: string; nombre: string; apellido: string; asistencias: Record<string, string> }[]
      }

      const totalClases = clases.length

      // Pesos de faltas (igual que el Excel original)
      const FALTA: Record<string, number> = {
        presente: 0, tarde: 0.5, presente_tarde: 0.25,
        ausente: 1, ausente_justificado: 1, viaje: 1,
      }
      const LABEL: Record<string, string> = {
        presente: 'P', tarde: 'T', presente_tarde: 'PT',
        ausente: 'A', ausente_justificado: 'AJ', viaje: 'V',
      }

      // Formatear fecha a DD/MM
      const fmtFecha = (iso: string) => {
        const [, m, d] = iso.split('-')
        return `${d.replace(/^0/, '')}/${m.replace(/^0/, '')}`
      }
      // Formatear número con coma decimal (estilo Excel argentino)
      const fmtNum = (n: number) => String(n).replace('.', ',')

      const rows: string[][] = []

      // Fila 1 — encabezado
      rows.push([
        '', 'Apellido', 'Nombre', 'Porcentaje.', 'Falta Tot.', 'Falta Just.', 'Falta Viaje.',
        ...clases.map(c => c.titulo === 'Talleres' ? `T ${fmtFecha(c.fecha)}` : fmtFecha(c.fecha)),
        'P', 'A', 'AJ', 'T', 'TJ', 'PT', 'V',
      ])

      // Fila 2 — pesos (como en el original)
      rows.push([
        '', '', '', '', '', '', '',
        ...clases.map(() => ''),
        '0', '0.5', '0.5', '0.5', '0.5', '0.25', '0',
      ])

      // Filas de talmidim
      talmidim.forEach((t, idx) => {
        const estados = clases.map(c => t.asistencias[c.id] || '')
        const label   = clases.map(c => LABEL[t.asistencias[c.id]] || '')

        const faltaTotal = estados.reduce((acc, e) => acc + (FALTA[e] ?? 0), 0)
        const justCount  = estados.filter(e => e === 'ausente_justificado').length
        const viajeCount = estados.filter(e => e === 'viaje').length

        const pct = totalClases > 0
          ? ((totalClases - faltaTotal) / totalClases * 100).toFixed(2).replace('.', ',') + '%'
          : '0,00%'

        const P  = estados.filter(e => e === 'presente').length
        const A  = estados.filter(e => e === 'ausente').length
        const AJ = justCount
        const Tc = estados.filter(e => e === 'tarde').length
        const PT = estados.filter(e => e === 'presente_tarde').length
        const V  = viajeCount

        rows.push([
          String(idx + 1),
          t.apellido,
          t.nombre,
          pct,
          fmtNum(faltaTotal),
          String(justCount),
          String(viajeCount),
          ...label,
          String(P), String(A), String(AJ), String(Tc), '0', String(PT), String(V),
        ])
      })

      // Fila en blanco
      rows.push([])

      // Fila de totales por clase (cantidad de presentes por fecha)
      const totalesPorClase = clases.map(c => {
        return String(talmidim.filter(t => ['presente', 'tarde', 'presente_tarde'].includes(t.asistencias[c.id])).length)
      })
      rows.push(['', '', '', '', '', '', '', ...totalesPorClase])

      // Generar CSV con BOM para Excel
      const csv = '﻿' + rows
        .map(row => row.map(cell => {
          const s = String(cell)
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s
        }).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentismo-majon-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Error al exportar. Intentá de nuevo.')
    } finally {
      setExportando(false)
    }
  }

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'presente':             return 'bg-green-100 text-green-700'
      case 'tarde':                return 'bg-amber-100 text-amber-700'
      case 'presente_tarde':       return 'bg-yellow-100 text-yellow-700'
      case 'ausente':              return 'bg-red-100 text-red-700'
      case 'ausente_justificado':  return 'bg-red-100 text-red-700'
      case 'viaje':                return 'bg-blue-100 text-blue-700'
      default:                     return 'bg-gray-100 text-gray-700'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'presente':             return 'P'
      case 'tarde':                return 'T'
      case 'presente_tarde':       return 'PT'
      case 'ausente':              return 'A'
      case 'ausente_justificado':  return 'AJ'
      case 'viaje':                return 'V'
      default:                     return estado
    }
  }

  const formatFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    })
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
            <h1 className="text-xl font-bold">{t('reportes.title')}</h1>
            <button
              onClick={handleExportCSV}
              disabled={exportando || !data}
              className="text-blue-200 hover:text-white text-sm disabled:opacity-50 flex items-center gap-1"
              title="Exportar CSV"
            >
              {exportando ? '...' : '⬇ CSV'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.loading')}</p>
          </div>
        ) : data ? (
          <>
            {/* Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">{data.totalClases}</div>
                <div className="text-gray-600">{t('reportes.stats.totalClasses')}</div>
              </div>
            </div>

            {/* Talmidim List */}
            <div className="space-y-3">
              {data.reportes.map((reporte) => (
                <div key={reporte.id}>
                  <button
                    onClick={() => fetchHistorial(reporte.id)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {reporte.apellido}
                        </span>
                        <span className="text-gray-600">, {reporte.nombre}</span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full font-bold ${getColorByPercentage(
                          reporte.porcentajeAsistencia
                        )}`}
                      >
                        {reporte.porcentajeAsistencia}%
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 text-sm">
                      <div className="text-green-600">
                        <span className="font-semibold">{reporte.presentes}</span> {t('reportes.stats.present')}
                      </div>
                      <div className="text-yellow-600">
                        <span className="font-semibold">{reporte.tardanzas}</span> {t('reportes.stats.late')}
                      </div>
                      <div className="text-red-600">
                        <span className="font-semibold">{reporte.ausentes + reporte.justificados}</span> {t('reportes.stats.absent')}
                        {reporte.justificados > 0 && (
                          <span className="text-xs ml-1 opacity-70">({reporte.justificados} just.)</span>
                        )}
                      </div>
                      {reporte.viajes > 0 && (
                        <div className="text-sky-600">
                          <span className="font-semibold">{reporte.viajes}</span> viaje{reporte.viajes !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {reporte.totalClasesTomadas} de {data.totalClases} clases
                    </div>
                  </button>

                  {/* Historial expandido */}
                  {selectedTalmid === reporte.id && historial && (
                    <div className="bg-gray-50 rounded-b-xl p-4 -mt-2 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-700 mb-3">{t('reportes.history.title')}</h3>
                      {historial.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('reportes.history.empty')}</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {historial.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-2 rounded-lg"
                            >
                              <div>
                                <span className="text-sm text-gray-600">
                                  {formatFecha(item.fecha)}
                                </span>
                                <span className="text-xs text-gray-400 ml-2 capitalize">
                                  {item.diaSemana}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(item.estado)}`}
                              >
                                {getEstadoLabel(item.estado)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600">{t('common.error.generic')}</div>
        )}
      </main>
    </div>
  )
}
