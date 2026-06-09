'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClaseItem {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  cancelada: boolean
  tipo: string
  asistencia: { claseId: string; estado: string; justificacion: string | null } | null
}

interface FeriadoItem {
  id: string
  fecha: string
  nombre: string
  tipo: string
}

const ESTADO_LABEL: Record<string, string> = {
  presente: 'Presente',
  tarde: 'Tarde',
  presente_tarde: 'P. Tarde',
  ausente: 'Ausente',
  ausente_justificado: 'Just.',
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

type Evento =
  | { tipo: 'clase'; fecha: string; data: ClaseItem }
  | { tipo: 'feriado'; fecha: string; data: FeriadoItem }

function agruparPorMes(clases: ClaseItem[], feriados: FeriadoItem[]): Record<string, Evento[]> {
  const meses: Record<string, Evento[]> = {}

  for (const c of clases) {
    const mes = c.fecha.slice(0, 7)
    if (!meses[mes]) meses[mes] = []
    meses[mes].push({ tipo: 'clase', fecha: c.fecha, data: c })
  }
  for (const f of feriados) {
    const mes = f.fecha.slice(0, 7)
    if (!meses[mes]) meses[mes] = []
    meses[mes].push({ tipo: 'feriado', fecha: f.fecha, data: f })
  }
  for (const mes of Object.keys(meses)) {
    meses[mes].sort((a, b) => a.fecha.localeCompare(b.fecha))
  }
  return meses
}

function formatMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default function CronogramaPage() {
  const [clases, setClases] = useState<ClaseItem[]>([])
  const [feriados, setFeriados] = useState<FeriadoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cronograma')
      .then(r => r.json())
      .then(d => {
        setClases(d.clases || [])
        setFeriados(d.feriados || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const grupos = agruparPorMes(clases, feriados)
  const mesesOrdenados = Object.keys(grupos).sort()

  // Resaltar el mes actual
  const mesActual = new Date().toISOString().slice(0, 7)

  // Calcular porcentaje de asistencia (clases pasadas no canceladas)
  const hoy = new Date().toISOString().split('T')[0]
  const clasesPasadas = clases.filter(c => !c.cancelada && c.fecha <= hoy)
  const totalPasadas = clasesPasadas.length
  const pesoTotal = clasesPasadas.reduce((acc, c) => {
    if (!c.asistencia) return acc + 1 // sin registro = ausente
    const e = c.asistencia.estado
    if (e === 'tarde') return acc + 0.5
    if (e === 'presente_tarde') return acc + 0.25
    if (e === 'presente') return acc
    return acc + 1 // ausente, ausente_justificado, viaje
  }, 0)
  const porcentaje = totalPasadas > 0
    ? Math.round(((totalPasadas - pesoTotal) / totalPasadas) * 100)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-100 hover:text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Cronograma</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Porcentaje de asistencia */}
        {!loading && porcentaje !== null && (
          <div className={`rounded-2xl p-4 mb-5 flex items-center justify-between ${
            porcentaje >= 75 ? 'bg-emerald-50 border border-emerald-200' :
            porcentaje >= 60 ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div>
              <p className={`text-sm font-medium ${
                porcentaje >= 75 ? 'text-emerald-700' :
                porcentaje >= 60 ? 'text-amber-700' :
                'text-red-700'
              }`}>Mi asistencia</p>
              <p className="text-xs text-gray-500">{totalPasadas} {totalPasadas === 1 ? 'clase' : 'clases'} hasta hoy</p>
            </div>
            <span className={`text-3xl font-bold ${
              porcentaje >= 75 ? 'text-emerald-600' :
              porcentaje >= 60 ? 'text-amber-600' :
              'text-red-600'
            }`}>{porcentaje}%</span>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mb-5 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Presente</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Tarde</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Ausente</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />Viaje</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />Feriado</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : mesesOrdenados.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No hay clases programadas.</p>
        ) : (
          <div className="space-y-6">
            {mesesOrdenados.map(mes => (
              <div key={mes}>
                <h2 className={`text-sm font-bold uppercase mb-2 capitalize ${mes === mesActual ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {formatMes(mes)}
                  {mes === mesActual && <span className="ml-2 text-xs normal-case bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Este mes</span>}
                </h2>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  {grupos[mes].map((ev, i) => {
                    const dd = ev.fecha.slice(8)
                    const mm = ev.fecha.slice(5, 7)

                    if (ev.tipo === 'feriado') {
                      const f = ev.data as FeriadoItem
                      return (
                        <div key={`f-${i}`} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 bg-purple-50">
                          <span className="text-sm font-mono text-purple-400 w-10 shrink-0">{dd}/{mm}</span>
                          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                          <span className="text-sm text-purple-700 flex-1 font-medium">{f.nombre}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${f.tipo === 'judio' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {f.tipo === 'judio' ? '✡️' : '🇦🇷'}
                          </span>
                        </div>
                      )
                    }

                    const c = ev.data as ClaseItem
                    const hoy = new Date().toISOString().split('T')[0]
                    const esPasada = c.fecha <= hoy
                    const esFutura = c.fecha > hoy

                    return (
                      <Link
                        key={`c-${i}`}
                        href={`/clase/${c.id}`}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition
                          ${c.cancelada ? 'opacity-40' : ''}
                          ${c.fecha === hoy ? 'bg-emerald-50' : ''}
                        `}
                      >
                        <span className={`text-sm font-mono w-10 shrink-0 ${c.fecha === hoy ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                          {dd}/{mm}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 capitalize truncate">
                            {c.diaSemana}
                            {c.fecha === hoy && <span className="ml-1 text-xs text-emerald-600">· Hoy</span>}
                          </p>
                          <p className="text-xs text-gray-400">{c.horaInicio}–{c.horaFin}</p>
                        </div>
                        {c.cancelada ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Cancelada</span>
                        ) : esPasada && c.asistencia ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[c.asistencia.estado] || 'bg-gray-100 text-gray-500'}`}>
                            {ESTADO_LABEL[c.asistencia.estado] || c.asistencia.estado}
                          </span>
                        ) : esPasada ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">–</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-500">Próxima</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
