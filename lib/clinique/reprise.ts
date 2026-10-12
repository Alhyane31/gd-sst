// Reprise des dossiers v1 → v2 : champs retirés de l'écran, regroupés dans data.archiveV1.
// Utilisé par prisma/reprise-dossier-v2.ts.

type Obj = Record<string, unknown>;

const texte = (...valeurs: unknown[]) => {
  for (const v of valeurs) if (typeof v === "string" && v.trim()) return v;
  return undefined;
};

/** Champs retirés de l'écran en v2, regroupés pour consultation */
export function construireArchive(data: Obj): Obj | null {
  const raw = (data.raw ?? {}) as Obj;
  const examen = (data.examenClinique ?? {}) as Obj;
  const activite = (data.activitesContraintes ?? {}) as Obj;

  const archive: Obj = {
    examenCliniqueComplet: texte(examen.examenCliniqueComplet, raw.examenCliniqueComplet),
    examensPracliniques: texte(examen.examensPracliniques, raw.examensPracliniques),
    presenceAideTechnique: texte(activite.presenceAideTechnique, raw.presenceAideTechnique),
    posturesPredominantes: texte(activite.posturesPredominantes, raw.posturesPredominantes),
    antecedentsTexteLibre: texte(data.antecedents, raw.antecedents),
  };
  for (const k of Object.keys(archive)) if (archive[k] === undefined) delete archive[k];
  return Object.keys(archive).length ? { ...archive, archiveLe: new Date().toISOString() } : null;
}

