// Renomme les formations et met les libellés services / postes en minuscules (1ère lettre majuscule).
// Les codes ne changent pas (les imports s'appuient sur les codes).
//
//   npx tsx prisma/normalize-libelles.ts           → aperçu, aucune écriture
//   npx tsx prisma/normalize-libelles.ts --apply   → sauvegarde JSON puis mise à jour
import "dotenv/config";
import { writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const APPLY = process.argv.includes("--apply");

const FORMATIONS: Record<string, string> = {
  HIR:  "Hôpital universitaire Ibn Rochd",
  HME:  "Hôpital universitaire mère-enfant « Abderrahim Harouchi »",
  H20A: "Hôpital universitaire 20 Août 1953",
  CCTD: "Hôpital universitaire - Centre de consultations et de traitements dentaires",
  DG:   "Direction générale",
  FM:   "Faculté de médecine",
};

// Sigles conservés en majuscules : O.R.L, S.A.M.U., C.C.T.D, A.S.D.E, P25...
function isSigle(word: string) {
  const w = word.replace(/[()]/g, "");
  return /^(\p{Lu}\.){2,}\p{Lu}?\.?$/u.test(w) || /^\p{Lu}+\d+$/u.test(w);
}

export function sentenceCase(value: string) {
  const lower = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (isSigle(w) ? w : w.toLocaleLowerCase("fr")))
    .join(" ");
  // 1ère lettre de la chaîne en majuscule
  return lower.replace(/\p{L}/u, (c) => c.toLocaleUpperCase("fr"));
}

async function main() {
  const [formations, services, postes] = await Promise.all([
    prisma.formation.findMany({ select: { id: true, code: true, libelle: true } }),
    prisma.service.findMany({ select: { id: true, code: true, libelle: true } }),
    prisma.poste.findMany({ select: { id: true, code: true, libelle: true } }),
  ]);

  const changes = {
    formation: formations
      .filter((f) => FORMATIONS[f.code] && FORMATIONS[f.code] !== f.libelle)
      .map((f) => ({ id: f.id, code: f.code, avant: f.libelle, apres: FORMATIONS[f.code] })),
    service: services
      .map((s) => ({ id: s.id, code: s.code, avant: s.libelle, apres: sentenceCase(s.libelle) }))
      .filter((c) => c.avant !== c.apres),
    poste: postes
      .map((p) => ({ id: p.id, code: p.code, avant: p.libelle, apres: sentenceCase(p.libelle) }))
      .filter((c) => c.avant !== c.apres),
  };

  const missing = Object.keys(FORMATIONS).filter((code) => !formations.some((f) => f.code === code));
  if (missing.length) console.warn("⚠️  Formations introuvables :", missing.join(", "));

  for (const [type, list] of Object.entries(changes)) {
    console.log(`\n=== ${type} (${list.length})`);
    for (const c of list) console.log(`  ${c.avant}  →  ${c.apres}`);
  }

  if (!APPLY) {
    console.log("\nAperçu uniquement. Relancer avec --apply pour enregistrer.");
    return;
  }

  const backup = path.join(__dirname, `backup-libelles-${Date.now()}.json`);
  writeFileSync(backup, JSON.stringify(changes, null, 2), "utf8");
  console.log(`\n💾 Sauvegarde : ${backup}`);

  await prisma.$transaction([
    ...changes.formation.map((c) => prisma.formation.update({ where: { id: c.id }, data: { libelle: c.apres } })),
    ...changes.service.map((c) => prisma.service.update({ where: { id: c.id }, data: { libelle: c.apres } })),
    ...changes.poste.map((c) => prisma.poste.update({ where: { id: c.id }, data: { libelle: c.apres } })),
  ]);

  console.log("✅ Libellés mis à jour.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
