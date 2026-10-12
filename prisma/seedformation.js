
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🚀 Seed started")
  const formations = [
    { code: "HIR", libelle: "Hôpital universitaire Ibn Rochd" },
{ code: "DG", libelle: "Direction générale" },
{ code: "CCTD", libelle: "Hôpital universitaire - Centre de consultations et de traitements dentaires" },
{ code: "HME", libelle: "Hôpital universitaire mère-enfant « Abderrahim Harouchi »" },
{ code: "H20A", libelle: "Hôpital universitaire 20 Août 1953" },
{ code: "FM", libelle: "Faculté de médecine" },


  ]

  
  for (const formation of formations) {
    await prisma.formation.upsert({
      where: { code: formation.code },
      update: {},
      create: formation,
    })
  }

  console.log("✅ formations insérés avec succès")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })