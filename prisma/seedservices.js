
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🚀 Seed started")


 const hir = await prisma.formation.findUnique({ where: { code: "HIR" } })
 const dg = await prisma.formation.findUnique({ where: { code: "DG" } })
 const cctd = await prisma.formation.findUnique({ where: { code: "CCTD" } })
 const hme = await prisma.formation.findUnique({ where: { code: "HME" } })
 const h20a = await prisma.formation.findUnique({ where: { code: "H20A" } })
 const fm = await prisma.formation.findUnique({ where: { code: "FM" } })


  const services = [
   { code: "HIR001", libelle: "ONCOLOGIE", formationId: hir.id },
{ code: "HIR002", libelle: "RADIOLOGIE DES URGENCES", formationId: hir.id },
{ code: "HIR003", libelle: "COMPTABILITÉ CLIENT ET RECOUVREMENT", formationId: hir.id },
{ code: "DG001", libelle: "SECRETARIAT GENERAL", formationId: dg.id },
{ code: "H20A001", libelle: "RADIOLOGIE", formationId: h20a.id },
{ code: "H20A002", libelle: "PERSONNEL ET AFFAIRES GÉNÉRALES", formationId: h20a.id },
{ code: "H20A003", libelle: "AFFAIRES FINANCIÈRES & CONTRÔLE DE GESTION", formationId: h20a.id },
{ code: "CCTD001", libelle: "ORTHOPEDIE DENTO FACIALE", formationId: cctd.id },
{ code: "HIR004", libelle: "DIRECTION", formationId: hir.id },
{ code: "HIR005", libelle: "PATRIMOINE ET MAINTENANCE", formationId: hir.id },
{ code: "HIR006", libelle: "BIOCHIMIE", formationId: hir.id },
{ code: "H20A004", libelle: "AFFAIRES PROFESSIONNELLES", formationId: h20a.id },
{ code: "HIR007", libelle: "RADIOLOGIE CENTRALE", formationId: hir.id },
{ code: "HIR008", libelle: "GYNÉCOLOGIE", formationId: hir.id },
{ code: "HIR009", libelle: "PARASITOLOGIE", formationId: hir.id },
{ code: "HME001", libelle: "AFFAIRES FINANCIÈRES & CONTRÔLE DE GESTION", formationId: hme.id },
{ code: "HIR010", libelle: "SANTÉ AU TRAVAIL", formationId: hir.id },
{ code: "HIR011", libelle: "ANATOMIE PATHOLOGIE", formationId: hir.id },
{ code: "DG002", libelle: "TRÉSORERIE PAIERIE", formationId: dg.id },
{ code: "HME002", libelle: "DIRECTION", formationId: hme.id },
{ code: "CCTD002", libelle: "AFF. ADM. FINAN. CONTROLE DE GESTION", formationId: cctd.id },
{ code: "HIR012", libelle: "HÉMATOLOGIE BIOLOGIQUE", formationId: hir.id },
{ code: "HIR013", libelle: "APPROVISIONNEMENTS", formationId: hir.id },
{ code: "HIR014", libelle: "BLOC CENTRAL", formationId: hir.id },
{ code: "HIR015", libelle: "MALADIE INFECTIEUSE", formationId: hir.id },
{ code: "H20A005", libelle: "APPROVISIONNEM. PATRIMOINE ET MAINTENANCE", formationId: h20a.id },
{ code: "HME003", libelle: "PÉDIATRIE 1", formationId: hme.id },
{ code: "HME004", libelle: "PÉDIATRIE 4", formationId: hme.id },
{ code: "HIR016", libelle: "RÉANIMATION CHIRURGICALE DES URGENCES", formationId: hir.id },
{ code: "HIR017", libelle: "CENTRE CONSULTATION POLYVALENTES", formationId: hir.id },
{ code: "HIR018", libelle: "TRAUMATO-ORTHOPEDIE URGENCES", formationId: hir.id },
{ code: "HIR019", libelle: "GASTRO-ENTEROLOGIE ET PROCTOLOGIE", formationId: hir.id },
{ code: "HIR020", libelle: "INTERNAT", formationId: hir.id },
{ code: "HIR021", libelle: "URGENCE VISCERALES", formationId: hir.id },
{ code: "HME005", libelle: "APPROVISIONNEM. PATRIMOINE ET MAINTENANCE", formationId: hme.id },
{ code: "HIR022", libelle: "MICROBIOLOGIE", formationId: hir.id },
{ code: "H20A006", libelle: "OPHTALMOLOGIE ADULTE", formationId: h20a.id },
{ code: "HIR023", libelle: "ACCUEIL DES URGENCES", formationId: hir.id },
{ code: "H20A007", libelle: "CHIRURGIE MAXILLO-FACIALE", formationId: h20a.id },
{ code: "HME006", libelle: "PERSONNEL ET AFFAIRES GÉNÉRALES", formationId: hme.id },
{ code: "HIR024", libelle: "PERSONNEL ET AFFAIRES GÉNÉRALES", formationId: hir.id },
{ code: "H20A008", libelle: "HÉMATOLOGIE", formationId: h20a.id },
{ code: "HIR025", libelle: "DERMATOLOGIE", formationId: hir.id },
{ code: "HME007", libelle: "MATERNITÉ", formationId: hme.id },
{ code: "HIR026", libelle: "PNEUMOLOGIE (P25)", formationId: hir.id },
{ code: "HIR027", libelle: "TAUMATO-ORTHOPEDIQUE", formationId: hir.id },
{ code: "HME008", libelle: "ORTHOPÉDIE TRAUMATO.PÉDIATRIQUE", formationId: hme.id },
{ code: "HIR028", libelle: "RÉANIMATION CHIRURGICALE", formationId: hir.id },
{ code: "HIR029", libelle: "MÉDECINE INTERNE", formationId: hir.id },
{ code: "HIR030", libelle: "ADDICTOLOGIE", formationId: hir.id },
{ code: "CCTD003", libelle: "SOINS INFIRMIERS ET D'ASSISTANCE", formationId: cctd.id },
{ code: "HIR031", libelle: "PSYCHIATRIE", formationId: hir.id },
{ code: "HME009", libelle: "PÉDIATRIE 3", formationId: hme.id },
{ code: "HME010", libelle: "URGENCES PÉDIATRIQUES", formationId: hme.id },
{ code: "HIR032", libelle: "MÉDECINE LÉGALE", formationId: hir.id },
{ code: "CCTD004", libelle: "APPROVISIONNEMENTS ET AFFAIRES GENERAL", formationId: cctd.id },
{ code: "HIR033", libelle: "IMMUNOLOGIE", formationId: hir.id },
{ code: "HME011", libelle: "RÉANIMATION DE LA MATERNITÉ", formationId: hme.id },
{ code: "HME012", libelle: "CENTRE DE CONSULTATIONS", formationId: hme.id },
{ code: "HME013", libelle: "PÉDIATRIE 2", formationId: hme.id },
{ code: "HIR034", libelle: "AILE 7", formationId: hir.id },
{ code: "H20A009", libelle: "ANÉSTHESIE RÉANIMATION", formationId: h20a.id },
{ code: "HIR035", libelle: "RÉANIMATION ET URGENCE MÉDICALES", formationId: hir.id },
{ code: "CCTD005", libelle: "URGENCES", formationId: cctd.id },
{ code: "HIR036", libelle: "NEUROCHIRURGIE", formationId: hir.id },
{ code: "HME014", libelle: "CHIRURGIE VISCÉRALE PÉDIATRIQUE", formationId: hme.id },
{ code: "HIR037", libelle: "CARDIOLOGIE", formationId: hir.id },
{ code: "CCTD006", libelle: "MEDECIN CHEF", formationId: cctd.id },
{ code: "HIR038", libelle: "AFFAIRE FINANCIÈRES ET CONTRÔLE DE GESTION", formationId: hir.id },
{ code: "HME015", libelle: "BLOC OPÉRATOIRE", formationId: hme.id },
{ code: "HIR039", libelle: "NEUROLOGIE", formationId: hir.id },
{ code: "DG003", libelle: "SECRETARIAT DU DIRECTEUR", formationId: dg.id },
{ code: "H20A010", libelle: "O.R.L", formationId: h20a.id },
{ code: "HIR040", libelle: "URGENCE NEUROCHIRURGICALES", formationId: hir.id },
{ code: "HME016", libelle: "RADIOLOGIE PÉDIATRIQUE", formationId: hme.id },
{ code: "HIR041", libelle: "CHIRURGIE CARDIO-VASCULAIRE", formationId: hir.id },
{ code: "HIR042", libelle: "AFFAIRE PROFESSIONNELLES", formationId: hir.id },
{ code: "H20A011", libelle: "URGENCES", formationId: h20a.id },
{ code: "CCTD007", libelle: "PEDODONTIE ET PREVENTION", formationId: cctd.id },
{ code: "HIR043", libelle: "CHIRURGIE THORACIQUE", formationId: hir.id },
{ code: "HIR044", libelle: "NÉPHROLOGIE", formationId: hir.id },
{ code: "HIR045", libelle: "CENTRE NATIONAL DES BRULÉS", formationId: hir.id },
{ code: "HIR046", libelle: "CHIRURGIE VISCERALE 3", formationId: hir.id },
{ code: "H20A012", libelle: "OPHTALMOLOGIE PÉDIATRIQUE", formationId: h20a.id },
{ code: "HME017", libelle: "ANÉSTHÉSIE RÉANIMATION PÉDIATRIQUE", formationId: hme.id },
{ code: "H20A013", libelle: "PNEUMOLOGIE", formationId: h20a.id },
{ code: "HIR047", libelle: "MÉDECINE PHYSIQUE ET RÉADAPTATION FONCTIONNELLE", formationId: hir.id },
{ code: "DG004", libelle: "SERVICE DE CONTRÔLE DE GESTION", formationId: dg.id },
{ code: "DG005", libelle: "COOPERATION & COMMUNICATION", formationId: dg.id },
{ code: "HME018", libelle: "PÉDOPSYCHIATRIE", formationId: hme.id },
{ code: "H20A014", libelle: "DIRECTION", formationId: h20a.id },
{ code: "H20A015", libelle: "INFORMATIQUE MEDICALE", formationId: h20a.id },
{ code: "DG006", libelle: "AUDIT INTERNE", formationId: dg.id },
{ code: "HME019", libelle: "AFFAIRES PROFESSIONNELLE", formationId: hme.id },
{ code: "HIR048", libelle: "MÉDECINE NUCLEAIRE", formationId: hir.id },
{ code: "CCTD008", libelle: "PROTHESE ADJOINTE", formationId: cctd.id },
{ code: "CCTD009", libelle: "ODONTOLOGIE CHIRURGICALE", formationId: cctd.id },
{ code: "CCTD010", libelle: "PROTHESE CONJOINTE", formationId: cctd.id },
{ code: "CCTD011", libelle: "ODONTOLOGIE CONSERVATRICE", formationId: cctd.id },
{ code: "CCTD012", libelle: "PARODONTOLOGIE", formationId: cctd.id },
{ code: "HIR049", libelle: "ENDOCRINO ET MALADIE METABOLIQUES", formationId: hir.id },
{ code: "HME020", libelle: "PÉDIATRIE 5", formationId: hme.id },
{ code: "HIR050", libelle: "CHIRURGIE VISCERALE 1", formationId: hir.id },
{ code: "HIR051", libelle: "ONCO-GYNÉCOLOGIE", formationId: hir.id },
{ code: "HIR052", libelle: "CENTRE ACCUEIL ET PRÉLÈVEMENT", formationId: hir.id },
{ code: "HIR053", libelle: "RHUMATOLOGIE", formationId: hir.id },
{ code: "HIR054", libelle: "UROLOGIE", formationId: hir.id },
{ code: "HIR055", libelle: "TRAUMATO-ORTHOPEDI DES URGENCES BLOC", formationId: hir.id },
{ code: "H20A016", libelle: "PHTISIOLOGIE", formationId: h20a.id },
{ code: "HIR056", libelle: "RADIOTHÉRAPIE", formationId: hir.id },
{ code: "HIR057", libelle: "MÉDECINE DE TRAVAIL", formationId: hir.id },
{ code: "FM001", libelle: "SERVICE EPIDEMIOLOGIE", formationId: fm.id },
{ code: "HIR058", libelle: "GÉNÉTIQUE MÉDICALE", formationId: hir.id },
{ code: "HIR059", libelle: "PHARMACOLOGIE TOXICOLOGIE", formationId: hir.id },
{ code: "HIR060", libelle: "S.A.M.U.", formationId: hir.id },
{ code: "FM002", libelle: "MEDECINE COMMUNAUTAIRE", formationId: fm.id },
{ code: "CCTD013", libelle: "LABORATOIRE DE PROTHESE", formationId: cctd.id },
{ code: "CCTD014", libelle: "BLOC OPERATOIRE", formationId: cctd.id },
{ code: "CCTD015", libelle: "C.C.T.D ( STERILISATION )", formationId: cctd.id },
{ code: "CCTD016", libelle: "RADIOLOGIE DES URGENCES", formationId: cctd.id },




  ]

  
  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: {},
      create: service,
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