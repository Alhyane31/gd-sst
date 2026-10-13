// Lecture / écriture du référentiel AES en base (côté serveur uniquement).
import type { Prisma, PrismaClient } from "@prisma/client";
import { fusionnerReferentiel, REFERENTIEL_AES_DEFAUT, type ReferentielAes } from "./referentiel";

export const CLES_REFERENTIEL = ["schemasTpe", "calendrier", "seuils", "annexes"] as const;
export type CleReferentiel = (typeof CLES_REFERENTIEL)[number];

type Db = Pick<PrismaClient, "aesReferentiel">;

/** Référentiel effectif : valeurs en base, complétées par les valeurs par défaut de la spécification */
export async function chargerReferentiel(db: Db): Promise<ReferentielAes> {
  const lignes = await db.aesReferentiel.findMany({ where: { cle: { in: [...CLES_REFERENTIEL] } } });
  const stocke = Object.fromEntries(lignes.map((l) => [l.cle, l.valeur])) as Partial<ReferentielAes>;
  return fusionnerReferentiel(stocke);
}

/** Crée les clés absentes avec les valeurs par défaut ; ne modifie jamais un paramétrage existant */
export async function initialiserReferentiel(db: Db): Promise<string[]> {
  const existantes = new Set((await db.aesReferentiel.findMany({ select: { cle: true } })).map((l) => l.cle));
  const creees: string[] = [];
  for (const cle of CLES_REFERENTIEL) {
    if (existantes.has(cle)) continue;
    await db.aesReferentiel.create({
      data: { cle, valeur: REFERENTIEL_AES_DEFAUT[cle] as unknown as Prisma.InputJsonValue },
    });
    creees.push(cle);
  }
  return creees;
}
