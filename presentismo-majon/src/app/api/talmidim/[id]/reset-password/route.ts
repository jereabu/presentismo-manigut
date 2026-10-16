import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { password } = await request.json()
  if (!password || password.length < 4) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
  }

  const talmid = await prisma.talmid.findFirst({
    where: { id, kitaId: session.kitaId },
  })
  if (!talmid) {
    return NextResponse.json({ error: 'Talmid no encontrado' }, { status: 404 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.talmid.update({
    where: { id },
    data: { passwordHash },
  })

  return NextResponse.json({ ok: true })
}
