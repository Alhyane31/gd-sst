
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Seed started")
  const formations = [
    { code: "HIR", libelle: "Hôpital Ibn Rochd" },
{ code: "DG", libelle: "Direction Générale" },
{ code: "CCTD", libelle: "CCTD" },
{ code: "HME", libelle: "Hôpital Mère-enfant" },
{ code: "H20A", libelle: "Hôpital du 20 A" },
{ code: "FM", libelle: "Faculté De Médecine" },


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