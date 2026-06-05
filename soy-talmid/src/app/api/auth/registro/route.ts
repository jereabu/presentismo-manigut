import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, code, nombre, apellido, email, password } = body

    // Paso 1: Verificar código
    if (action === 'verify-code') {
      if (!code) {
        return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
      }

      const inviteCode = await prisma.inviteCode.findUnique({
        where: { code: code.toUpperCase() }
      })

      if (!inviteCode) {
        return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
      }

      if (!inviteCode.activo) {
        return NextResponse.json({ error: 'Código desactivado' }, { status: 400 })
      }

      if (inviteCode.usosMax !== null && inviteCode.usosActuales >= inviteCode.usosMax) {
        return NextResponse.json({ error: 'Código agotado' }, { status: 400 })
      }

      return NextResponse.json({ valid: true })
    }

    // Paso 2: Registrar usuario
    if (action === 'register') {
      if (!code || !nombre || !apellido || !email || !password) {
        return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
      }

      // Verificar código nuevamente
      const inviteCode = await prisma.inviteCode.findUnique({
        where: { code: code.toUpperCase() }
      })

      if (!inviteCode || !inviteCode.activo) {
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
      }

      if (inviteCode.usosMax !== null && inviteCode.usosActuales >= inviteCode.usosMax) {
        return NextResponse.json({ error: 'Código agotado' }, { status: 400 })
      }

      // Buscar talmid por nombre y apellido (case-insensitive)
      const candidatos = await prisma.talmid.findMany({
        where: {
          nombre: { equals: nombre.trim(), mode: 'insensitive' },
          apellido: { equals: apellido.trim(), mode: 'insensitive' },
          activo: true,
        }
      })

      if (candidatos.length === 0) {
        return NextResponse.json(
          { error: 'No encontramos un alumno con ese nombre y apellido. Verificá los datos o contactá a tu mejanej.' },
          { status: 404 }
        )
      }

      if (candidatos.length > 1) {
        return NextResponse.json(
          { error: 'Hay más de un alumno con ese nombre. Contactá a tu mejanej para que te registre manualmente.' },
          { status: 409 }
        )
      }

      const talmid = candidatos[0]

      if (talmid.passwordHash) {
        return NextResponse.json(
          { error: 'Este alumno ya tiene una cuenta registrada. Si olvidaste tu contraseña, contactá a tu mejanej.' },
          { status: 400 }
        )
      }

      // Hashear contraseña y actualizar talmid con el email ingresado
      const passwordHash = await hashPassword(password)

      await prisma.$transaction([
        prisma.talmid.update({
          where: { id: talmid.id },
          data: {
            passwordHash,
            email: email.toLowerCase().trim(),
          }
        }),
        prisma.inviteCode.update({
          where: { id: inviteCode.id },
          data: { usosActuales: { increment: 1 } }
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Cuenta creada exitosamente'
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
