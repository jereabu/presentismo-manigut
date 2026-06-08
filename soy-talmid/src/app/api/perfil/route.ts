import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const talmid = await prisma.talmid.findUnique({
      where: { id: session.talmidId },
      select: { id: true, nombre: true, apellido: true, email: true, fotoUrl: true },
    })

    return NextResponse.json({ talmid })
  } catch (error) {
    console.error('Error fetching perfil:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { fotoUrl } = await request.json()

    const talmid = await prisma.talmid.update({
      where: { id: session.talmidId },
      data: { fotoUrl: fotoUrl ?? null },
      select: { id: true, nombre: true, apellido: true, email: true, fotoUrl: true },
    })

    return NextResponse.json({ success: true, talmid })
  } catch (error) {
    console.error('Error updating perfil:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
