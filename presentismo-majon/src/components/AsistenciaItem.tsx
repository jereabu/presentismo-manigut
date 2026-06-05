'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Estado = 'presente' | 'tarde' | 'presente_tarde' | 'ausente' | 'ausente_justificado' | 'viaje' | null

interface AsistenciaItemProps {
  talmidId: string
  nombre: string
  apellido: string
  estadoInicial: Estado
  justificacionInicial: string | null
  claseId: string
  onEstadoChange: (talmidId: string, estado: Estado, justificacion: string | null) => void
  tieneAusenciaProgramada?: boolean
  ausenciaProgramadaJustificacion?: string | null
}

export default function AsistenciaItem({
  talmidId,
  nombre,
  apellido,
  estadoInicial,
  justificacionInicial,
  claseId,
  onEstadoChange,
  tieneAusenciaProgramada = false,
  ausenciaProgramadaJustificacion = null,
}: AsistenciaItemProps) {
  const [estado, setEstado] = useState<Estado>(estadoInicial)
  const [justificacion, setJustificacion] = useState(justificacionInicial || ausenciaProgramadaJustificacion || '')
  const [showJustificacion, setShowJustificacion] = useState(false)
  const [pendingEstado, setPendingEstado] = useState<Estado>(null)
  const [saving, setSaving] = useState(false)
  const t = useTranslations('asistenciaItem')

  const ausenciaPendiente = tieneAusenciaProgramada && !estadoInicial

  const guardarAsistencia = async (nuevoEstado: Estado, justif: string | null = null) => {
    if (!nuevoEstado) return
    setSaving(true)
    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claseId, talmidId, estado: nuevoEstado, justificacion: justif }),
      })
      if (res.ok) {
        setEstado(nuevoEstado)
        setJustificacion(justif || '')
        onEstadoChange(talmidId, nuevoEstado, justif)
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
      setPendingEstado(null)
    }
  }

  const handleEstadoClick = (nuevoEstado: Estado) => {
    if (saving) return
    if (nuevoEstado === 'ausente_justificado') {
      setPendingEstado('ausente_justificado')
      setShowJustificacion(true)
      return
    }
    guardarAsistencia(nuevoEstado, null)
    setShowJustificacion(false)
    setJustificacion('')
  }

  const handleGuardarJustificacion = () => {
    if (!justificacion.trim()) return
    guardarAsistencia('ausente_justificado', justificacion.trim())
    setShowJustificacion(false)
    setPendingEstado(null)
  }

  const handleCancelarJustificacion = () => {
    setShowJustificacion(false)
    setPendingEstado(null)
    setJustificacion(justificacionInicial || '')
  }

  const btn = (btnEstado: Estado, label: string, colors: { sel: string; def: string }) => {
    const active = estado === btnEstado || pendingEstado === btnEstado
    return (
      <button
        onClick={() => handleEstadoClick(btnEstado)}
        disabled={saving}
        className={`py-2 px-1 rounded-lg font-medium text-xs transition-all active:scale-95 ${active ? colors.sel : colors.def}`}
      >
        {label}
      </button>
    )
  }

  const BADGE: Record<string, { bg: string; text: string; icon: string }> = {
    presente:             { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✓'  },
    tarde:                { bg: 'bg-amber-100',   text: 'text-amber-700',  icon: 'T'  },
    presente_tarde:       { bg: 'bg-yellow-100',  text: 'text-yellow-700', icon: 'PT' },
    ausente:              { bg: 'bg-red-100',     text: 'text-red-700',    icon: '✗'  },
    ausente_justificado:  { bg: 'bg-orange-100',  text: 'text-orange-700', icon: '📋' },
    viaje:                { bg: 'bg-blue-100',    text: 'text-blue-700',   icon: '✈️' },
  }

  const badge = estado ? BADGE[estado] : null

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-opacity ${saving ? 'opacity-60' : ''} ${ausenciaPendiente ? 'border-orange-300 bg-orange-50' : ''}`}>
      {tieneAusenciaProgramada && (
        <div className="flex items-center gap-1 mb-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full w-fit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Vacaciones
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold text-gray-800">{apellido}</span>
          <span className="text-gray-600">, {nombre}</span>
        </div>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
            {badge.icon}
          </span>
        )}
      </div>

      {/* Fila 1: presencias */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        {btn('presente',       t('present'),      { sel: 'bg-green-600 text-white',  def: 'bg-green-100 text-green-700 hover:bg-green-200'  })}
        {btn('tarde',          t('lateMinor'),     { sel: 'bg-amber-500 text-white',  def: 'bg-amber-100 text-amber-700 hover:bg-amber-200'   })}
        {btn('presente_tarde', t('late'),          { sel: 'bg-yellow-500 text-white', def: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' })}
      </div>
      {/* Fila 2: ausencias */}
      <div className="grid grid-cols-3 gap-1">
        {btn('ausente',             t('absent'),         { sel: 'bg-red-600 text-white',    def: 'bg-red-100 text-red-700 hover:bg-red-200'       })}
        {btn('ausente_justificado', t('absentJustified'),{ sel: 'bg-orange-600 text-white', def: 'bg-orange-100 text-orange-700 hover:bg-orange-200' })}
        {btn('viaje',               t('travel'),         { sel: 'bg-blue-600 text-white',   def: 'bg-blue-100 text-blue-700 hover:bg-blue-200'     })}
      </div>

      {showJustificacion && (
        <div className="mt-3 space-y-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
          <label className="block text-sm font-medium text-orange-800">{t('justification.label')}</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder={t('justification.placeholder')}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 outline-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleGuardarJustificacion} disabled={saving || !justificacion.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-lg disabled:opacity-50">
              {saving ? t('justification.confirming') : t('justification.confirm')}
            </button>
            <button onClick={handleCancelarJustificacion} disabled={saving}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg">
              {t('justification.cancel')}
            </button>
          </div>
        </div>
      )}

      {estado === 'ausente_justificado' && justificacion && !showJustificacion && (
        <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          <span className="font-medium">{t('justification.reason')}</span> {justificacion}
        </div>
      )}

      {ausenciaPendiente && !showJustificacion && (
        <div className="mt-2 text-sm text-orange-700 bg-orange-100 px-3 py-2 rounded-lg">
          <span className="font-medium">Ausencia programada:</span> {ausenciaProgramadaJustificacion}
          <div className="text-xs text-orange-600 mt-1">Click en &quot;Ausente&quot; para confirmar</div>
        </div>
      )}
    </div>
  )
}
