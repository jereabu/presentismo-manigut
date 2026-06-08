'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Talmid {
  id: string
  nombre: string
  apellido: string
  email: string | null
  fotoUrl: string | null
}

export default function PerfilPage() {
  const [talmid, setTalmid] = useState<Talmid | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/perfil')
      .then(r => r.json())
      .then(d => {
        setTalmid(d.talmid)
        setPreview(d.talmid?.fotoUrl || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const MAX = 400
          let { width, height } = img
          if (width > height) {
            if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
          } else {
            if (height > MAX) { width = Math.round(width * MAX / height); height = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Seleccioná una imagen'); return }
    if (file.size > 5 * 1024 * 1024) { alert('La imagen es muy grande (máx 5MB)'); return }

    setUploading(true)
    try {
      const base64 = await compressImage(file)
      setPreview(base64)
    } catch {
      alert('Error al procesar la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoUrl: preview }),
      })
      if (res.ok) {
        const d = await res.json()
        setTalmid(d.talmid)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const initials = talmid ? `${talmid.nombre[0]}${talmid.apellido[0]}`.toUpperCase() : '?'
  const hasChanged = preview !== (talmid?.fotoUrl || null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-emerald-100 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">Mi perfil</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Foto de perfil"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-emerald-200 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-700">{initials}</span>
              </div>
            )}

            {/* Botón cámara */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md flex items-center justify-center transition"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {talmid && (
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-gray-800">{talmid.nombre} {talmid.apellido}</p>
              {talmid.email && <p className="text-sm text-gray-500 mt-1">{talmid.email}</p>}
            </div>
          )}
        </div>

        {/* Acciones de foto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">Foto de perfil</h2>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">
              {preview ? 'Cambiar foto' : 'Subir foto'}
            </span>
          </button>

          {preview && (
            <button
              onClick={handleRemove}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition text-sm font-medium"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar foto
            </button>
          )}
        </div>

        {/* Guardar */}
        {hasChanged && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
            ) : 'Guardar foto'}
          </button>
        )}

        {saved && (
          <div className="mt-3 text-center text-sm text-emerald-600 font-medium">
            ✓ Foto guardada correctamente
          </div>
        )}
      </main>
    </div>
  )
}
