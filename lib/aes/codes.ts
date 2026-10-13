// Codes stables des réponses AES, partagés par la config du formulaire et les règles.
// Les libellés affichés sont ceux de la spécification (app/aes/config).

export const EXPOSITION = {
  PIQURE: "PIQURE",
  COUPURE: "COUPURE",
  PROJ_MUQUEUSE: "PROJ_MUQUEUSE",
  PROJ_PEAU_LESEE: "PROJ_PEAU_LESEE",
  PROJ_PEAU_SAINE: "PROJ_PEAU_SAINE",
  MORSURE_GRIFFURE: "MORSURE_GRIFFURE",
} as const;

export const EXPOSITIONS_PLAIE: string[] = [EXPOSITION.PIQURE, EXPOSITION.COUPURE, EXPOSITION.MORSURE_GRIFFURE];
export const EXPOSITIONS_PROJECTION: string[] = [EXPOSITION.PROJ_MUQUEUSE, EXPOSITION.PROJ_PEAU_LESEE, EXPOSITION.PROJ_PEAU_SAINE];

export const MATERIEL_AIGUILLE = ["AIGUILLE_CREUSE", "AIGUILLE_PLEINE"];

/** Statut sérologique de la source (grille 34) */
export const SOURCE = { NEGATIF: "NEGATIF", POSITIF: "POSITIF", INCONNU: "INCONNU", EN_ATTENTE: "EN_ATTENTE" } as const;

/** Bilans biologiques (lignes des grilles 50 et 66, bilans prévus du calendrier) */
export const BILANS = ["VIH", "VHC", "ARN_VHC", "AG_HBS", "ANTI_HBC", "ANTI_HBS", "ALAT", "CREATININE", "BHCG"] as const;
export type Bilan = (typeof BILANS)[number];

export const BILAN_LIBELLES: Record<Bilan, string> = {
  VIH: "VIH",
  VHC: "VHC",
  ARN_VHC: "ARN VHC",
  AG_HBS: "Ag HBs",
  ANTI_HBC: "Anti-HBc",
  ANTI_HBS: "Anti-HBs",
  ALAT: "ALAT",
  CREATININE: "Créatinine",
  BHCG: "β-hCG",
};

/** Visites du calendrier de suivi (section 10) */
export const SUIVI_CODES = ["J1_J7", "S2", "S6", "S12"] as const;
export type SuiviCode = (typeof SUIVI_CODES)[number];

export const SUIVI_LIBELLES: Record<SuiviCode | "NON_PROGRAMMEE", string> = {
  J1_J7: "J1–J7",
  S2: "S2",
  S6: "S6",
  S12: "S12",
  NON_PROGRAMMEE: "Non programmée",
};

export const SUIVI_STATUTS = ["PREVUE", "FAITE", "NON_INDIQUEE", "NON_FAITE"] as const;
export type SuiviStatut = (typeof SUIVI_STATUTS)[number];

export const SUIVI_STATUT_LIBELLES: Record<SuiviStatut, string> = {
  PREVUE: "Prévue",
  FAITE: "Faite",
  NON_INDIQUEE: "Non indiquée",
  NON_FAITE: "Non faite",
};

/** Données de la déclaration : { [champId]: valeur } (voir app/aes/config/declaration.ts) */
export type DeclarationData = Record<string, unknown>;

/** Statut VIH / Ag HBs de la source, lu dans la grille 34 */
export function statutSource(d: DeclarationData, ligne: "VIH" | "AG_HBS" | "ANTI_HBC" | "VHC"): string | undefined {
  const grille = (d.statutSource ?? {}) as Record<string, string>;
  return grille[ligne];
}

/** « Inconnu » ou « Prélevé, en attente » : traités comme inconnus par les règles */
export function sourceInconnue(statut: string | undefined): boolean {
  return statut === undefined || statut === SOURCE.INCONNU || statut === SOURCE.EN_ATTENTE;
}

export const liste = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/** Champ 38 : facteurs retenus par l'annexe B pour le TPE VIH (la zone d'endémie VHB n'en fait pas partie) */
export const FACTEURS_RISQUE_VIH = ["OPPORTUNISTE", "PARTENAIRES_HSH", "DROGUES_IV", "POLYTRANSFUSION", "ENFANT_MERE_VIH"];

/** Champ 38 : facteurs de la note ** de l'annexe C (immunoglobulines légitimes sans ténofovir) */
export const FACTEURS_RISQUE_VHB_IG = ["ZONE_ENDEMIE", "DROGUES_IV", "PARTENAIRES_HSH"];

/**
 * « Ne correspond pas à la définition d'un AES » (V2) : projection sur peau saine, urines ou selles
 * non souillées de sang, ou niveau de risque retenu « Pas d'AES ». Lavage simple, pas de suivi.
 */
export function estPasDAes(d: DeclarationData): boolean {
  return d.typeExposition === EXPOSITION.PROJ_PEAU_SAINE || d.liquide === "URINES_SELLES" || d.niveauRisque === "PAS_D_AES";
}
