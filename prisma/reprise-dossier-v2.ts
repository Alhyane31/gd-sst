// Reprise des dossiers saisis avant le format v2 (examen structuré, antécédents détaillés).
// Non destructif : ajoute data.archiveV1 avec les champs retirés de l'écran ; aucune donnée n'est supprimée.
//
//   npx tsx prisma/reprise-dossier-v2.ts           → aperçu, aucune écriture
//   npx tsx prisma/reprise-dossier-v2.ts --apply   → sauvegarde JSON (storage/backups) puis mise à jour
import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { construireArchive } from "../lib/clinique/reprise";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const APPLY = process.argv.includes("--apply");

type Obj = Record<string, unknown>;

async function main() {
  const formulaires = await prisma.formulaire.findMany({
    where: { schemaVersion: { lt: 2 } },
    select: { id: true, statut: true, data: true },
  });

  const aMettreAJour = formulaires
    .map((f) => {
      const data = (f.data ?? {}) as Obj;
      if (data.archiveV1) return null;
      const archive = construireArchive(data);
      return archive ? { id: f.id, statut: f.statut, data, archive } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  console.log(`Formulaires au format v1 : ${formulaires.length} ; à archiver : ${aMettreAJour.length}`);
  for (const f of aMettreAJour) {
    console.log(`  ${f.id} (${f.statut}) : ${Object.keys(f.archive).filter((k) => k !== "archiveLe").join(", ")}`);
  }

  if (!APPLY) {
    console.log("\nAperçu uniquement. Relancer avec --apply pour enregistrer.");
    return;
  }
  if (aMettreAJour.length === 0) return;

  const dir = path.join(process.cwd(), "storage", "backups");
  mkdirSync(dir, { recursive: true });
  const backup = path.join(dir, `formulaires-avant-v2-${Date.now()}.json`);
  writeFileSync(backup, JSON.stringify(aMettreAJour.map(({ id, data }) => ({ id, data })), null, 2), "utf8");
  console.log(`\n💾 Sauvegarde : ${backup}`);

  await prisma.$transaction(
    aMettreAJour.map((f) =>
      prisma.formulaire.update({
        where: { id: f.id },
        data: { data: { ...f.data, archiveV1: f.archive } as Prisma.InputJsonValue },
      })
    )
  );
  console.log("✅ Archives ajoutées (aucune donnée supprimée).");
}

if (process.argv[1]?.includes("reprise-dossier-v2")) {
  main()
    .catch((e) => {
      console.error("❌ Erreur :", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
