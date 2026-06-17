import { prisma } from '@/lib/db'

export interface AsistenciaStats {
  presentes: number
  tardes: number
  tardanzas: number
  ausentes: number
  justificados: number
  viajes: number
}

/**
 * Calcula las "faltas" ponderadas a partir de las estadísticas de asistencia.
 * A / AJ / V = 1 falta, T (tarde) = 0.5, PT (presente_tarde) = 0.25
 */
export function calcularFaltas(stats: AsistenciaStats): number {
  return (
    stats.ausentes * 1 +
    stats.justificados * 1 +
    stats.viajes * 1 +
    stats.tardes * 0.5 +
    stats.tardanzas * 0.25
  )
}

/**
 * Calcula el porcentaje de asistencia: MAX(0, (denominador - faltas) / denominador * 100)
 * Equivale al SI.ERROR(MAX(0; ...) del Excel. Nunca devuelve negativo.
 */
export function calcularPorcentajeAsistencia(faltas: number, denominador: number): number {
  return denominador > 0
    ? Math.max(0, Math.round(((denominador - faltas) / denominador) * 100))
    : 0
}

/**
 * Cuenta las clases pasadas (hasta hoy inclusive) y no canceladas de una kitá.
 * Este es el denominador oficial para el cálculo de porcentaje de asistencia.
 */
export async function getTotalClasesPasadas(kitaId: string): Promise<number> {
  const hoy = new Date()
  hoy.setUTCHours(23, 59, 59, 999)
  return prisma.clase.count({
    where: {
      cancelada: false,
      fecha: { lte: hoy },
      kitot: { some: { kitaId } },
    },
  })
}
