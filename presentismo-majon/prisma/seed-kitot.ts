import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();


async function main() {
  const kitot = [
    {
      nombre:        "alef",
      nombreDisplay: "Alef",
      anio:          1,
      colorHex:      "#10B981",
      password:      "lamroth2026",
    },
    {
      nombre:        "bet",
      nombreDisplay: "Bet",
      anio:          2,
      colorHex:      "#3B82F6",
      password:      "4GU4NT3b3t",
    },
  ];

  console.log("Creando kitot...");

  for (const k of kitot) {
    const passwordHash = await bcrypt.hash(k.password, 10);
    await prisma.kita.upsert({
      where:  { nombre: k.nombre },
      update: { nombreDisplay: k.nombreDisplay, anio: k.anio, colorHex: k.colorHex },
      create: {
        nombre:        k.nombre,
        nombreDisplay: k.nombreDisplay,
        anio:          k.anio,
        colorHex:      k.colorHex,
        passwordHash,
        activa:        true,
      },
    });
    console.log(`✅ Kitá ${k.nombreDisplay} lista.`);
  }

  console.log("✅ Todas las kitot cargadas correctamente.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
