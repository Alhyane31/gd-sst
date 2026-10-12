// prisma/reset-convocations.ts
//
// Vide uniquement les convocations (et tout ce qui en dépend : visites liées,
// formulaires, études de poste, avis spécialisés, pathologies/affectations
// rattachées à ces formulaires) pour pouvoir retester l'import de convocations.
// Le reste (Personnel, Poste, Service, Formation, Bordereau, visites "libres"
// non liées à une convocation) est préservé.
//
// Usage :
//   npx tsx prisma/reset-convocations.ts            -> aperçu (dry-run), rien n'est supprimé
//   npx tsx prisma/reset-convocations.ts --force     -> exécute réellement le vidage
//
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Client = PrismaClient | Prisma.TransactionClient;

async function main() {
  const force = process.argv.includes("--force");

  const convocationIds = (await prisma.convocation.findMany({ select: { id: true } })).map((c) => c.id);
  const visiteIds = (
    await prisma.visite.findMany({
      where: { convocationId: { in: convocationIds } },
      select: { id: true },
    })
  ).map((v) => v.id);
  const formulaireIds = (
    await prisma.formulaire.findMany({
      where: { visiteId: { in: visiteIds } },
      select: { id: true },
    })
  ).map((f) => f.id);

  const steps: { label: string; count: number; deleteMany: (client: Client) => Promise<{ count: number }> }[] = [
    {
      label: "AvisSpecialise",
      count: await prisma.avisSpecialise.count({ where: { visiteId: { in: visiteIds } } }),
      deleteMany: (c) => c.avisSpecialise.deleteMany({ where: { visiteId: { in: visiteIds } } }),
    },
    {
      label: "EtudeDePoste",
      count: await prisma.etudeDePoste.count({ where: { visiteId: { in: visiteIds } } }),
      deleteMany: (c) => c.etudeDePoste.deleteMany({ where: { visiteId: { in: visiteIds } } }),
    },
    {
      label: "PersonnelPathologie",
      count: await prisma.personnelPathologie.count({ where: { formulaireId: { in: formulaireIds } } }),
      deleteMany: (c) => c.personnelPathologie.deleteMany({ where: { formulaireId: { in: formulaireIds } } }),
    },
    {
      label: "PersonnelAffectationHistory",
      count: await prisma.personnelAffectationHistory.count({ where: { formulaireId: { in: formulaireIds } } }),
      deleteMany: (c) => c.personnelAffectationHistory.deleteMany({ where: { formulaireId: { in: formulaireIds } } }),
    },
    {
      label: "Formulaire",
      count: formulaireIds.length,
      deleteMany: (c) => c.formulaire.deleteMany({ where: { id: { in: formulaireIds } } }),
    },
    {
      label: "Visite",
      count: visiteIds.length,
      deleteMany: (c) => c.visite.deleteMany({ where: { id: { in: visiteIds } } }),
    },
    {
      label: "Convocation",
      count: convocationIds.length,
      deleteMany: (c) => c.convocation.deleteMany({ where: { id: { in: convocationIds } } }),
    },
  ];

  const total = steps.reduce((sum, s) => sum + s.count, 0);

  console.log("📋 Lignes concernées par le vidage :");
  steps.forEach((s) => console.log(`   - ${s.label.padEnd(28)} ${s.count}`));
  console.log(`   TOTAL : ${total} lignes\n`);
  console.log("🛡️  Préservé : Personnel, Poste, Service, Formation, Bordereau, visites non liées à une convocation\n");

  if (!force) {
    console.log("ℹ️  Mode aperçu (dry-run). Aucune donnée supprimée.");
    console.log("   Relancez avec --force pour exécuter réellement le vidage :");
    console.log("   npx tsx prisma/reset-convocations.ts --force");
    return;
  }

  if (total === 0) {
    console.log("✅ Rien à supprimer, aucune convocation en base.");
    return;
  }

  console.log("🧹 Vidage en cours...");
  await prisma.$transaction(async (tx) => {
    for (const step of steps) {
      const result = await step.deleteMany(tx);
      console.log(`   ✔ ${step.label.padEnd(28)} ${result.count} supprimée(s)`);
    }
  });

  console.log("\n✅ Convocations (et dépendances) vidées avec succès.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du vidage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
