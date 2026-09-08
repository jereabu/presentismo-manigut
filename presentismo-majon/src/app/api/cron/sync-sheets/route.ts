import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/db'

const FALTA: Record<string, number> = {
  presente: 0, tarde: 0.5, presente_tarde: 0.25,
  ausente: 1, ausente_justificado: 1, viaje: 1,
}
const LABEL: Record<string, string> = {
  presente: 'P', tarde: 'T', presente_tarde: 'PT',
  ausente: 'A', ausente_justificado: 'AJ', viaje: 'V',
}
const PRESENTES = new Set(['presente', 'tarde', 'presente_tarde'])

// Extrae la fecha UTC como "YYYY-MM-DD" (las fechas se guardan a medianoche UTC)
function toArDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function fmtFecha(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d.replace(/^0/, '')}/${m.replace(/^0/, '')}`
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
    const sheetGid = process.env.GOOGLE_SHEETS_GID!

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = spreadsheet.data.sheets?.find(
      s => String(s.properties?.sheetId) === sheetGid
    )
    const sheetName = sheet?.properties?.title ?? 'Sheet1'
    const sheetId   = sheet?.properties?.sheetId

    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)

    // Este sheet es exclusivo de Kita Bet
    const kita = await prisma.kita.findFirstOrThrow({ where: { nombre: 'bet' } })

    let debugJornadas: { arDate: string; label: string; ids: string[] }[] = []

    {
      // ── 1. Obtener todas las clases ──────────────────────────────────────
      const clasesRaw = await prisma.clase.findMany({
        where: {
          cancelada: false,
          fecha: { lte: hoy },
          kitot: { some: { kitaId: kita.id } },
        },
        orderBy: { fecha: 'asc' },
        select: { id: true, fecha: true },
      })

      // ── 2. Agrupar por fecha Argentina → una jornada = un grupo de IDs ──
      // Si hay múltiples Clase records en la misma fecha AR, sus IDs se
      // agrupan para que la asistencia de cualquiera de ellos cuente.
      const jornadasMap = new Map<string, { arDate: string; ids: string[] }>()
      for (const c of clasesRaw) {
        const arDate = toArDate(c.fecha)
        if (!jornadasMap.has(arDate)) {
          jornadasMap.set(arDate, { arDate, ids: [c.id] })
        } else {
          jornadasMap.get(arDate)!.ids.push(c.id)
        }
      }
      const jornadas = Array.from(jornadasMap.values()) // ya ordenadas por fecha asc
      debugJornadas = jornadas.map(j => ({ arDate: j.arDate, label: fmtFecha(j.arDate), ids: j.ids }))

      // ── 3. Talmidim con sus asistencias ──────────────────────────────────
      const talmidim = await prisma.talmid.findMany({
        where: { activo: true, kitaId: kita.id },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: { asistencias: { select: { claseId: true, estado: true } } },
      })

      // ── 4. Helpers por talmid ─────────────────────────────────────────────
      // Dado un talmid y una jornada, devuelve el estado (primer ID que tenga registro)
      const getEstado = (
        aMap: Record<string, string>,
        ids: string[]
      ): string => {
        for (const id of ids) {
          if (aMap[id]) return aMap[id]
        }
        return ''
      }

      // ── 5. Construir filas ────────────────────────────────────────────────
      const rows: (string | number)[][] = []

      // Fila 1: encabezado
      rows.push([
        '', 'Apellido', 'Nombre', 'Porcentaje', 'Falta Tot.', 'Falta Just.', 'Falta Viaje',
        ...jornadas.map(j => fmtFecha(j.arDate)),
        'P', 'A', 'AJ', 'T', 'PT', 'V',
      ])

      // Fila 2: total de presentes por jornada
      const totalPorJornada = jornadas.map(j =>
        talmidim.filter(t => {
          const aMap = Object.fromEntries(t.asistencias.map(a => [a.claseId, a.estado]))
          return PRESENTES.has(getEstado(aMap, j.ids))
        }).length
      )
      rows.push(['', '', '', '', '', '', '', ...totalPorJornada, '', '', '', '', '', ''])

      // Filas de talmidim
      talmidim.forEach((t, idx) => {
        const aMap = Object.fromEntries(t.asistencias.map(a => [a.claseId, a.estado]))
        const estados = jornadas.map(j => getEstado(aMap, j.ids))
        const label   = estados.map(e => LABEL[e] || '')

        const conRegistro  = estados.filter(e => e !== '')
        const totalPropios = conRegistro.length
        const faltaTotal   = conRegistro.reduce((acc, e) => acc + (FALTA[e] ?? 0), 0)
        const justCount    = estados.filter(e => e === 'ausente_justificado').length
        const viajeCount   = estados.filter(e => e === 'viaje').length

        const pct = totalPropios > 0
          ? Math.max(0, (totalPropios - faltaTotal) / totalPropios)
          : 0

        const P  = estados.filter(e => e === 'presente').length
        const A  = estados.filter(e => e === 'ausente').length
        const Tc = estados.filter(e => e === 'tarde').length
        const PT = estados.filter(e => e === 'presente_tarde').length

        rows.push([
          idx + 1, t.apellido, t.nombre,
          pct, faltaTotal, justCount, viajeCount,
          ...label,
          P, A, justCount, Tc, PT, viajeCount,
        ])
      })

      // ── 6. Escribir en el sheet ───────────────────────────────────────────
      // Deshacer merges antes de escribir (evita que celdas fusionadas de syncs
      // anteriores hagan aparecer la misma fecha en dos columnas)
      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              unmergeCells: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 200 },
              },
            }],
          },
        }).catch(() => { /* no hay merges, ignorar */ })
      }

      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A:ZZ` })
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      })

      // Formatear columna D (porcentaje) como %
      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              repeatCell: {
                range: { sheetId, startRowIndex: 2, endRowIndex: rows.length, startColumnIndex: 3, endColumnIndex: 4 },
                cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.00%' } } },
                fields: 'userEnteredFormat.numberFormat',
              },
            }],
          },
        })
      }
    }

    return NextResponse.json({ ok: true, kita: kita.nombre, sheetName, sheetGidFound: sheetId, sheetGidEnv: sheetGid, syncedAt: new Date().toISOString(), _debug: debugJornadas })
  } catch (error) {
    console.error('Error sync-sheets:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
