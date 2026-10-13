// Reprise des dossiers AES V1 → V2 (spécification Module_AES_specifications_V2.md).
//  - déclarations : options supprimées ou renommées (voir lib/aes/repriseV2.ts), anciennes valeurs archivées ;
//  - référentiel : passage aux valeurs V2 des seules clés jamais modifiées par un utilisateur.
//
//   npx tsx prisma/reprise-aes-v2.ts           → aperçu, aucune écriture
//   npx tsx prisma/reprise-aes-v2.ts --apply   → sauvegarde JSON (storage/backups) puis mise à jour
import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { migrerDeclarationV2 } from "../lib/aes/repriseV2";
import { REFERENTIEL_AES_DEFAUT } from "../lib/aes/referentiel";
import { CLES_REFERENTIEL } from "../lib/aes/referentielDb";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const APPLY = process.argv.includes("--apply");

async function main() {
  const declarations = await prisma.aesDeclaration.findMany({ select: { id: true, statut: true, data: true } });
  const aMigrer = declarations
    .map((d) => ({ ...d, ...migrerDeclarationV2((d.data ?? {}) as Record<string, unknown>) }))
    .filter((d) => d.changements.length > 0);

  console.log(`Déclarations AES : ${declarations.length} ; à reprendre : ${aMigrer.length}`);
  for (const d of aMigrer) {
    for (const c of d.changements) {
      console.log(`  ${d.id} (${d.statut}) — ${c.champ} : ${JSON.stringify(c.avant)} → ${JSON.stringify(c.apres)}${c.automatique ? "" : "  ⚠ à vérifier"}${c.note ? ` (${c.note})` : ""}`);
    }
  }

  const referentiel = await prisma.aesReferentiel.findMany({ where: { cle: { in: [...CLES_REFERENTIEL] } } });
  const refAMettreAJour = referentiel.filter((r) => r.updatedById === null);
  const refPersonnalise = referentiel.filter((r) => r.updatedById !== null);
  console.log(`\nRéférentiel : ${refAMettreAJour.map((r) => r.cle).join(", ") || "aucune clé"} → valeurs V2`);
  if (refPersonnalise.length) {
    console.log(`  ⚠ clés modifiées par un utilisateur, NON mises à jour : ${refPersonnalise.map((r) => r.cle).join(", ")} (à revoir dans Référentiels → AES)`);
  }

  if (!APPLY) {
    console.log("\nAperçu uniquement. Relancer avec --apply pour enregistrer.");
    return;
  }

  const dir = path.join(process.cwd(), "storage", "backups");
  mkdirSync(dir, { recursive: true });
  const backup = path.join(dir, `aes-avant-v2-${Date.now()}.json`);
  // sauvegarde des données d'avant reprise
  writeFileSync(
    backup,
    JSON.stringify(
      { declarations: declarations.filter((d) => aMigrer.some((m) => m.id === d.id)).map((d) => ({ id: d.id, data: d.data })), referentiel },
      null,
      2
    ),
    "utf8"
  );
  console.log(`\n💾 Sauvegarde : ${backup}`);

  await prisma.$transaction([
    ...aMigrer.map((d) =>
      prisma.aesDeclaration.update({
        where: { id: d.id },
        data: {
          data: d.data as Prisma.InputJsonValue,
          geste: typeof d.data.geste === "string" ? d.data.geste : null,
          niveauRisque: typeof d.data.niveauRisque === "string" ? d.data.niveauRisque : null,
        },
      })
    ),
    ...refAMettreAJour.map((r) =>
      prisma.aesReferentiel.update({
        where: { cle: r.cle },
        data: { valeur: REFERENTIEL_AES_DEFAUT[r.cle as (typeof CLES_REFERENTIEL)[number]] as unknown as Prisma.InputJsonValue },
      })
    ),
  ]);
  console.log("✅ Reprise V2 appliquée (anciennes valeurs archivées dans data.repriseV2).");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
