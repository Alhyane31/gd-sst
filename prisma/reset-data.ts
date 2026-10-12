// prisma/reset-data.ts
//
// Vide les données "métier" (personnel, postes, services, formations,
// visites, convocations, formulaires, bordereaux, pathologies, expertises, etc.)
// tout en préservant les données de référence/config :
//   - Cim11Node (classification CIM11)
//   - User / AppRole (comptes utilisateurs)
//   - JourFerie (calendrier des jours fériés)
//
// Usage :
//   npx tsx prisma/reset-data.ts            -> aperçu (dry-run), rien n'est supprimé
//   npx tsx prisma/reset-data.ts --force     -> exécute réellement le vidage
//
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Client = PrismaClient | Prisma.TransactionClient;

// Ordre important : on supprime d'abord les tables "enfants" (celles qui
// possèdent une clé étrangère) avant les tables "parentes" qu'elles référencent.
const steps: {
  label: string;
  count: () => Promise<number>;
  deleteMany: (client: Client) => Promise<{ count: number }>;
}[] = [
  { label: "AvisSpecialise", count: () => prisma.avisSpecialise.count(), deleteMany: (c) => c.avisSpecialise.deleteMany() },
  { label: "EtudeDePoste", count: () => prisma.etudeDePoste.count(), deleteMany: (c) => c.etudeDePoste.deleteMany() },
  { label: "Expertise", count: () => prisma.expertise.count(), deleteMany: (c) => c.expertise.deleteMany() },
  { label: "PersonnelPathologie", count: () => prisma.personnelPathologie.count(), deleteMany: (c) => c.personnelPathologie.deleteMany() },
  { label: "PersonnelAffectationHistory", count: () => prisma.personnelAffectationHistory.count(), deleteMany: (c) => c.personnelAffectationHistory.deleteMany() },
  { label: "Formulaire", count: () => prisma.formulaire.count(), deleteMany: (c) => c.formulaire.deleteMany() },
  { label: "Visite", count: () => prisma.visite.count(), deleteMany: (c) => c.visite.deleteMany() },
  { label: "Convocation", count: () => prisma.convocation.count(), deleteMany: (c) => c.convocation.deleteMany() },
  { label: "Bordereau", count: () => prisma.bordereau.count(), deleteMany: (c) => c.bordereau.deleteMany() },
  { label: "Personnel", count: () => prisma.personnel.count(), deleteMany: (c) => c.personnel.deleteMany() },
  { label: "PosteDetail", count: () => prisma.posteDetail.count(), deleteMany: (c) => c.posteDetail.deleteMany() },
  { label: "Poste", count: () => prisma.poste.count(), deleteMany: (c) => c.poste.deleteMany() },
  { label: "Service", count: () => prisma.service.count(), deleteMany: (c) => c.service.deleteMany() },
  { label: "Formation", count: () => prisma.formation.count(), deleteMany: (c) => c.formation.deleteMany() },
];

async function main() {
  const force = process.argv.includes("--force");

  const counts = await Promise.all(steps.map((s) => s.count()));
  const total = counts.reduce((sum, n) => sum + n, 0);

  console.log("📋 Lignes concernées par le vidage :");
  steps.forEach((s, i) => console.log(`   - ${s.label.padEnd(28)} ${counts[i]}`));
  console.log(`   TOTAL : ${total} lignes\n`);
  console.log("🛡️  Tables préservées : Cim11Node, User, AppRole, JourFerie\n");

  if (!force) {
    console.log("ℹ️  Mode aperçu (dry-run). Aucune donnée supprimée.");
    console.log("   Relancez avec --force pour exécuter réellement le vidage :");
    console.log("   npx tsx prisma/reset-data.ts --force");
    return;
  }

  if (total === 0) {
    console.log("✅ Rien à supprimer, la base est déjà vide sur ce périmètre.");
    return;
  }

  console.log("🧹 Vidage en cours...");
  await prisma.$transaction(async (tx) => {
    for (const step of steps) {
      const result = await step.deleteMany(tx);
      console.log(`   ✔ ${step.label.padEnd(28)} ${result.count} supprimée(s)`);
    }
  });

  console.log("\n✅ Base vidée avec succès (CIM11, comptes et jours fériés conservés).");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du vidage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
