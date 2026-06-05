import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const { count } = await prisma.clase.updateMany({ data: { titulo: null } })
  console.log(`✓ ${count} clases actualizadas`)
}
main().finally(() => prisma.$disconnect())
