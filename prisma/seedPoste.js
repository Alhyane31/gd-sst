
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Seed started")
  const postes = [
 { code: "ASDES", libelle: "A.S.D.E SPÉCIALISTE"},
{ code: "ADA", libelle: "ADJOINT ADMINISTRATIF"},
{ code: "ADT", libelle: "ADJOINT TECHNIQUE"},
{ code: "ADM", libelle: "ADMINISTRATEUR"},
{ code: "ARCH", libelle: "ARCHITECTE"},
{ code: "ASSMS", libelle: "ASSISTANT MÉDICO-SOCIAL"},
{ code: "ATTS", libelle: "ATTACHÉ SCIENTIFIQUE"},
{ code: "MED", libelle: "MEDECIN"},
{ code: "INF", libelle: "INFIRMIER"},
{ code: "PRO", libelle: "PROFESSEUR"},
{ code: "ING", libelle: "INGENIEUR"},
{ code: "PHA", libelle: "PHARMACIEN"},
{ code: "RED", libelle: "REDACTEUR"},
{ code: "REE", libelle: "RÉÉDUCATEUR"},
{ code: "SAGF", libelle: "SAGE FEMME"},
{ code: "TEC", libelle: "TECHNICIEN"},
{ code: "TECS", libelle: "TECHNICIEN DE SANTÉ"},


  ]

  
  for (const poste of postes) {
    await prisma.poste.upsert({
      where: { code: poste.code },
      update: {},
      create: poste,
    })
  }

  console.log("✅ Postes insérés avec succès")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })