// Reprise des déclarations AES saisies selon la spécification V1 vers les options de la V2.
// Les anciennes valeurs sont conservées dans data.repriseV2 (aucune perte).

type Obj = Record<string, unknown>;

export type Correspondance = {
  vers: string | null; // null : option supprimée, sans équivalent
  /** false : rapprochement à confirmer (signalé dans le rapport) */
  automatique: boolean;
  note?: string;
};

/** Options supprimées ou renommées entre V1 et V2 (champs à choix unique) */
export const CORRESPONDANCES_V2: Record<string, Record<string, Correspondance>> = {
  geste: {
    GLYCEMIE: { vers: "PRELEVEMENT_CAPILLAIRE", automatique: true },
    VVP: { vers: "POSE_PERFUSION", automatique: false, note: "« Pose de voie veineuse périphérique » → « Pose ou dépose de perfusion »" },
    CHIRURGICAL: { vers: "PLAIE_PEROPERATOIRE", automatique: false, note: "« Geste chirurgical » → « Plaie peropératoire (instrument chirurgical) »" },
  },
  dureeLavage: {
    CINQ: { vers: "CINQ_PLUS", automatique: true },
    DIX_PLUS: { vers: "CINQ_PLUS", automatique: true },
  },
  antisepsie: {
    CHLORHEXIDINE: { vers: "AUTRE", automatique: false, note: "Chlorhexidine supprimée en V2 : reprise en « Autre »" },
  },
  niveauRisque: {
    PAS_DE_RISQUE: { vers: "PAS_D_AES", automatique: true },
  },
};

/** Options supprimées des champs à choix multiple */
export const SUPPRESSIONS_MULTI_V2: Record<string, Record<string, string>> = {
  prophylaxieVhb: { TENOFOVIR: "Option « Ténofovir » supprimée en V2 (conservée dans l'archive du dossier)" },
};

export type ChangementV2 = { champ: string; avant: unknown; apres: unknown; automatique: boolean; note?: string };

/** Données V1 → V2 ; renvoie aussi la liste des changements (rapport) */
export function migrerDeclarationV2(data: Obj): { data: Obj; changements: ChangementV2[] } {
  const next: Obj = { ...data };
  const changements: ChangementV2[] = [];

  for (const [champ, table] of Object.entries(CORRESPONDANCES_V2)) {
    const v = data[champ];
    if (typeof v !== "string" || !table[v]) continue;
    const c = table[v];
    if (c.vers === null) delete next[champ];
    else next[champ] = c.vers;
    changements.push({ champ, avant: v, apres: c.vers, automatique: c.automatique, note: c.note });
  }

  for (const [champ, supprimees] of Object.entries(SUPPRESSIONS_MULTI_V2)) {
    const v = data[champ];
    if (!Array.isArray(v)) continue;
    const retirees = v.filter((x) => typeof x === "string" && supprimees[x]);
    if (!retirees.length) continue;
    const reste = v.filter((x) => !retirees.includes(x));
    if (reste.length) next[champ] = reste;
    else delete next[champ];
    changements.push({ champ, avant: v, apres: reste, automatique: false, note: retirees.map((x) => supprimees[x as string]).join(" ; ") });
  }

  if (changements.length) {
    const anciennes = Object.fromEntries(changements.map((c) => [c.champ, c.avant]));
    next.repriseV2 = { reprisLe: new Date().toISOString(), anciennesValeurs: anciennes };
  }
  return { data: next, changements };
}
