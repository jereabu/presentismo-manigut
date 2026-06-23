'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
  cantidadClases: number
}

type Filtro = 'todos' | 'mejanej' | 'capacitador'

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [showModal, setShowModal] = useState(false)
  const [nuevoDocente, setNuevoDocente] = useState({ nombre: '', apellido: '', tipo: 'mejanej' })
  const [saving, setSaving] = useState(false)

  // Selección
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => { fetchDocentes() }, [])

  const fetchDocentes = async () => {
    try {
      const res = await fetch('/api/docentes')
      const data = await res.json()
      setDocentes(data.docentes || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDocente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoDocente.nombre || !nuevoDocente.apellido) return
    setSaving(true)
    try {
      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDocente),
      })
      if (res.ok) {
        const data = await res.json()
        setDocentes([...docentes, data.docente])
        setNuevoDocente({ nombre: '', apellido: '', tipo: 'mejanej' })
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    setDeleting(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/docentes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setDocentes(prev => prev.filter(d => !selected.has(d.id)))
        setSelected(new Set())
        setSelectMode(false)
        setShowConfirm(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setDeleting(false)
    }
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const docentesFiltrados = docentes.filter(d =>
    filtro === 'todos' ? true : d.tipo === filtro
  )
  const mejanjim = docentes.filter(d => d.tipo === 'mejanej')
  const capacitadores = docentes.filter(d => d.tipo === 'capacitador')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-purple-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {selectMode ? (
              <button onClick={exitSelectMode} className="text-purple-200 hover:text-white text-sm">
                Cancelar
              </button>
            ) : (
              <Link href="/" className="text-purple-200 hover:text-white">← Volver</Link>
            )}
            <h1 className="text-xl font-bold">
              {selectMode && selected.size > 0 ? `${selected.size} seleccionado${selected.size > 1 ? 's' : ''}` : 'Docentes'}
            </h1>
            {selectMode ? (
              <button
                onClick={() => {
                  const allIds = docentesFiltrados.map(d => d.id)
                  const allSelected = allIds.every(id => selected.has(id))
                  if (allSelected) {
                    setSelected(new Set())
                  } else {
                    setSelected(new Set(allIds))
                  }
                }}
                className="text-purple-200 hover:text-white text-sm"
              >
                {docentesFiltrados.every(d => selected.has(d.id)) ? 'Ninguno' : 'Todos'}
              </button>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="text-purple-200 hover:text-white text-sm"
              >
                Seleccionar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['todos', 'mejanej', 'capacitador'] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filtro === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'todos' ? `Todos (${docentes.length})` : f === 'mejanej' ? `Mejanjim (${mejanjim.length})` : `Capacitadores (${capacitadores.length})`}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <span className="text-2xl font-bold text-purple-700">{mejanjim.length}</span>
            <span className="text-purple-600 block text-sm">Mejanjim</span>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <span className="text-2xl font-bold text-blue-700">{capacitadores.length}</span>
            <span className="text-blue-600 block text-sm">Capacitadores</span>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : docentesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500">No hay docentes registrados</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Agregar docente
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docentesFiltrados.map((docente) => {
              const isSelected = selected.has(docente.id)
              const card = (
                <div className={`flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm transition ${
                  selectMode ? 'cursor-pointer' : 'hover:shadow-md'
                } ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
                  {/* Checkbox en modo selección */}
                  {selectMode && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                    docente.tipo === 'mejanej' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <span className={`font-semibold text-lg ${
                      docente.tipo === 'mejanej' ? 'text-purple-600' : 'text-blue-600'
                    }`}>
                      {docente.nombre[0]}{docente.apellido[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {docente.apellido}, {docente.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        docente.tipo === 'mejanej' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {docente.tipo === 'mejanej' ? 'Mejanej' : 'Capacitador'}
                      </span>
                      {docente.cantidadClases > 0 && (
                        <span className="text-sm text-gray-500">
                          {docente.cantidadClases} clase{docente.cantidadClases > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {!selectMode && (
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              )

              return selectMode ? (
                <div key={docente.id} onClick={() => toggleSelect(docente.id)}>
                  {card}
                </div>
              ) : (
                <Link key={docente.id} href={`/docentes/${docente.id}`}>
                  {card}
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* Barra de acción en modo selección */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-20">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => selected.size > 0 && setShowConfirm(true)}
              disabled={selected.size === 0}
              className="w-full py-3 rounded-xl font-semibold text-white transition bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400"
            >
              {selected.size === 0
                ? 'Seleccioná docentes para eliminar'
                : `Eliminar ${selected.size} docente${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* FAB - solo fuera de modo selección */}
      {!selectMode && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition flex items-center justify-center z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Modal agregar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Nuevo docente</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddDocente} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nuevoDocente.nombre}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombre: e.target.value })}
                  placeholder="Ej: Juan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={nuevoDocente.apellido}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellido: e.target.value })}
                  placeholder="Ej: Perez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={nuevoDocente.tipo}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="mejanej">Mejanej</option>
                  <option value="capacitador">Capacitador</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar docente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Eliminar {selected.size} docente{selected.size > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {selected.size === 1
                ? `Se eliminará ${docentes.find(d => selected.has(d.id))?.nombre} ${docentes.find(d => selected.has(d.id))?.apellido}. Esta acción no se puede deshacer.`
                : `Se eliminarán ${selected.size} docentes. Esta acción no se puede deshacer.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
