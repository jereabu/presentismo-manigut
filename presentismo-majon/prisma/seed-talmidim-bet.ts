import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const kita = await prisma.kita.findUnique({ where: { nombre: "bet" } });
  if (!kita) throw new Error("Kitá 'bet' no encontrada. Corré seed-kitot.ts primero.");

  const talmidim = [
    { nombre: "Delfina",   apellido: "Attas",       email: null },
    { nombre: "Matias",    apellido: "Bal",          email: null },
    { nombre: "Julian",    apellido: "Birbayer",     email: null },
    { nombre: "Carola",    apellido: "Bompadre",     email: null },
    { nombre: "Lola",      apellido: "Budman",       email: null },
    { nombre: "Benicio",   apellido: "Cattaneo",     email: null },
    { nombre: "Melina",    apellido: "Dain",         email: null },
    { nombre: "Tadeo",     apellido: "Dyjament",     email: null },
    { nombre: "Joaquin",   apellido: "Divinsky",     email: null },
    { nombre: "Luna",      apellido: "Ezernitchi",   email: null },
    { nombre: "Tomer",     apellido: "Frenkel",      email: null },
    { nombre: "Jazmin",    apellido: "Fridman",      email: null },
    { nombre: "Lucas",     apellido: "Gel",          email: null },
    { nombre: "Mia",       apellido: "Gimpel",       email: null },
    { nombre: "Lucas",     apellido: "Gola",         email: null },
    { nombre: "Tobias",    apellido: "Gola",         email: null },
    { nombre: "Ema",       apellido: "Goldenberg",   email: null },
    { nombre: "Manuela",   apellido: "Goldestein",   email: null },
    { nombre: "Ilai",      apellido: "Gribov",       email: null },
    { nombre: "Juliana",   apellido: "Grunewald",    email: null },
    { nombre: "Bianca",    apellido: "Guildenfenik", email: null },
    { nombre: "Nicolas",   apellido: "Hoffman",      email: null },
    { nombre: "Matias",    apellido: "Kosoy",        email: null },
    { nombre: "Joaquin",   apellido: "Kuschnir",     email: null },
    { nombre: "Delfina",   apellido: "Lekier",       email: null },
    { nombre: "Federico",  apellido: "Low",          email: null },
    { nombre: "Theo",      apellido: "Milstein",     email: null },
    { nombre: "Delfina",   apellido: "Mina",         email: null },
    { nombre: "Julieta",   apellido: "Naccas",       email: null },
    { nombre: "Benjamin",  apellido: "Romano",       email: null },
    { nombre: "Manuel",    apellido: "Saadia",       email: null },
    { nombre: "Lucia",     apellido: "Satz",         email: null },
    { nombre: "Sofia",     apellido: "Sedler",       email: null },
    { nombre: "Ana",       apellido: "Siseles",      email: null },
    { nombre: "Naomi",     apellido: "Skornik",      email: "naomiskornik@icloud.com" },
    { nombre: "Mila",      apellido: "Smolkin",      email: null },
    { nombre: "Luli",      apellido: "Stupnik",      email: null },
  ];

  console.log(`Cargando ${talmidim.length} talmidim para kitá Bet...`);

  for (const t of talmidim) {
    if (t.email) {
      // Con email: upsert seguro
      await prisma.talmid.upsert({
        where: { email: t.email },
        update: { kitaId: kita.id, activo: true },
        create: { nombre: t.nombre, apellido: t.apellido, email: t.email, kitaId: kita.id, activo: true },
      });
    } else {
      // Sin email: crear solo si no existe ya (por nombre + apellido + kitaId)
      const existe = await prisma.talmid.findFirst({
        where: { nombre: t.nombre, apellido: t.apellido, kitaId: kita.id },
      });
      if (!existe) {
        await prisma.talmid.create({
          data: { nombre: t.nombre, apellido: t.apellido, email: null, kitaId: kita.id, activo: true },
        });
      }
    }
  }

  console.log("✅ Talmidim de Bet cargados correctamente.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
