
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Seed started")

await prisma.jourFerie.createMany({
  data: [
    { date: new Date("2026-01-11"), label: "Manifeste de l'indépendance"},
    { date: new Date("2026-05-01"), label: "Fête du Travail"},
    { date: new Date("2026-07-30"), label: "Fête du Trône"},
  ],
});


  
 

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