
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Catégories (PosteDetail) par poste — code poste : [code détail, libellé]
const details = {
  INF: [
    ["INF_POLYVALENT", "Infirmier polyvalent"],
    ["INF_IAR", "Infirmier en anesthésie et réanimation (IAR)"],
    ["INF_URGENCE_SI", "Infirmier en soins d’urgence et soins intensifs"],
    ["INF_SANTE_MENTALE", "Infirmier en santé mentale"],
    ["INF_SANTE_FAMILLE", "Infirmier en santé de la famille et santé communautaire"],
    ["INF_NEPHRO_DIALYSE", "Infirmier spécialisé en maladies rénales et dialyse (néphrologie)"],
    ["INF_GERIATRIE", "Infirmier en gériatrie"],
    ["INF_BLOC_OPERATOIRE", "Infirmier de bloc opératoire"],
    ["INF_PEDIATRIE_NEONAT", "Infirmier en soins pédiatriques et néonatals"],
  ],
  TECS: [
    ["TECS_LABORATOIRE", "Technicien de laboratoire"],
    ["TECS_RADIOLOGIE", "Technicien de radiologie / Imagerie médicale"],
    ["TECS_PREPARATEUR_PHARMA", "Préparateur en pharmacie"],
    ["TECS_STATISTIQUE", "Technicien en statistique sanitaire"],
    ["TECS_SANTE_ENVIRONNEMENT", "Technicien en santé et environnement"],
    ["TECS_MAINTENANCE_BIOMED", "Technicien en maintenance biomédicale"],
    ["TECS_DIETETICIEN", "Diététicien / Nutritionniste"],
  ],
  MED: [
    ["MED_RESIDENT", "Résident"],
    ["MED_INTERNE", "Interne"],
    ["MED_GENERALISTE", "Généraliste"],
    ["MED_SPECIALISTE", "Spécialiste"],
  ],
}

async function main() {
  console.log("🚀 Seed catégories de postes")

  for (const [posteCode, items] of Object.entries(details)) {
    const poste = await prisma.poste.findUnique({ where: { code: posteCode } })
    if (!poste) throw new Error(`Poste introuvable: ${posteCode}`)

    for (const [code, libelle] of items) {
      await prisma.posteDetail.upsert({
        where: { code },
        update: { libelle, posteId: poste.id, isActive: true },
        create: { code, libelle, posteId: poste.id, isActive: true },
      })
    }
  }

  console.log("✅ Catégories insérées avec succès")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
