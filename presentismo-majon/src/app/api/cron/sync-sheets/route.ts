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

function fmtFecha(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d.replace(/^0/, '')}/${m.replace(/^0/, '')}`
}

function fmtNum(n: number) {
  return String(n).replace('.', ',')
}

export async function GET(request: NextRequest) {
  // Proteger con CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
    const sheetGid = process.env.GOOGLE_SHEETS_GID!

    // Autenticar con Google
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })

    // Obtener el nombre de la hoja a partir del gid
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = spreadsheet.data.sheets?.find(
      s => String(s.properties?.sheetId) === sheetGid
    )
    const sheetName = sheet?.properties?.title ?? 'Sheet1'

    // Obtener datos de la DB — misma lógica que /api/reportes/export
    const hoy = new Date()
    hoy.setUTCHours(23, 59, 59, 999)

    // Sync para todas las kitot activas
    const kitot = await prisma.kita.findMany({ where: { activa: true } })

    for (const kita of kitot) {
      const clases = await prisma.clase.findMany({
        where: {
          cancelada: false,
          fecha: { lte: hoy },
          kitot: { some: { kitaId: kita.id } },
        },
        orderBy: { fecha: 'asc' },
        select: { id: true, fecha: true, diaSemana: true, titulo: true },
      })

      const talmidim = await prisma.talmid.findMany({
        where: { activo: true, kitaId: kita.id },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: { asistencias: { select: { claseId: true, estado: true } } },
      })

      const rows: (string | number)[][] = []

      // Encabezado
      rows.push([
        '', 'Apellido', 'Nombre', 'Porcentaje', 'Falta Tot.', 'Falta Just.', 'Falta Viaje',
        ...clases.map(c => c.titulo === 'Talleres' ? `T ${fmtFecha(c.fecha.toISOString().split('T')[0])}` : fmtFecha(c.fecha.toISOString().split('T')[0])),
        'P', 'A', 'AJ', 'T', 'PT', 'V',
      ])

      // Filas de talmidim
      talmidim.forEach((t, idx) => {
        const asistenciaMap = Object.fromEntries(t.asistencias.map(a => [a.claseId, a.estado]))
        const estados = clases.map(c => asistenciaMap[c.id] || '')
        const label   = clases.map(c => LABEL[asistenciaMap[c.id]] || '')

        // Mismo cálculo que la página: denominador = registros propios
        const estadosConRegistro = estados.filter(e => e !== '')
        const totalPropios = estadosConRegistro.length
        const faltaTotal = estadosConRegistro.reduce((acc, e) => acc + (FALTA[e] ?? 0), 0)
        const justCount  = estados.filter(e => e === 'ausente_justificado').length
        const viajeCount = estados.filter(e => e === 'viaje').length

        const pct = totalPropios > 0
          ? Math.max(0, (totalPropios - faltaTotal) / totalPropios)
          : 0

        const P  = estados.filter(e => e === 'presente').length
        const A  = estados.filter(e => e === 'ausente').length
        const AJ = justCount
        const Tc = estados.filter(e => e === 'tarde').length
        const PT = estados.filter(e => e === 'presente_tarde').length
        const V  = viajeCount

        rows.push([
          idx + 1,
          t.apellido,
          t.nombre,
          pct,  // número para que Sheets lo formatee como %
          faltaTotal,
          justCount,
          viajeCount,
          ...label,
          P, A, AJ, Tc, PT, V,
        ])
      })

      // Escribir en la hoja (usa el nombre de la hoja encontrado por gid)
      const range = `${sheetName}!A1`
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A:ZZ` })
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      })

      // Formatear columna de porcentaje (col D = índice 3) como %
      const sheetId = sheet?.properties?.sheetId
      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              repeatCell: {
                range: { sheetId, startRowIndex: 1, endRowIndex: rows.length, startColumnIndex: 3, endColumnIndex: 4 },
                cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.00%' } } },
                fields: 'userEnteredFormat.numberFormat',
              },
            }],
          },
        })
      }
    }

    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Error sync-sheets:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
