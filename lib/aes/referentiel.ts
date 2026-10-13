// Référentiel AES paramétrable (table AesReferentiel). Ces valeurs par défaut reprennent les annexes
// de la spécification ; le protocole du P23 prime : tout est modifiable depuis /referentiels/aes.
import type { Bilan, SuiviCode } from "./codes";

export type SchemaTpe = {
  code: string;
  libelle: string;
  molecules: string;
  remarques: string;
  /** utilisé par l'annexe C (immunoglobulines non nécessaires si ténofovir dans le TPE…) */
  contientTenofovir: boolean;
  /** proposé dans la liste « Schéma prescrit » (champ 53) */
  actif: boolean;
};

/** Conditions de l'annexe E, évaluées par lib/aes/calendrier.ts */
export const CONDITIONS_BILAN = {
  TOUS: "Pour tous",
  VACCINE_TITRE_INCONNU: "Si vacciné et titre inconnu",
  NON_VACCINE: "Si non vacciné",
  TPE: "Si indication de TPE (TPE accepté)",
  TPE_COMORBIDITE: "Si TPE et comorbidité ou crainte de iatrogénie",
  S6_VIH: "Si TPE, ou sans TPE si source VIH inconnue ou VIH+ avec charge virale détectable",
  SOURCE_ARN_VHC_POSITIF: "Si ARN VHC positif chez la source",
  NON_IMMUNISE_SOURCE_HBS: "Si victime non immunisée et source Ag HBs+ ou inconnue",
} as const;
export type ConditionBilan = keyof typeof CONDITIONS_BILAN;

export type VisiteCalendrier = {
  code: SuiviCode;
  libelle: string;
  decalageJours: number;
  bilans: { bilan: Bilan; condition: ConditionBilan }[];
};

export type LigneAnnexe = string[];

export type ReferentielAes = {
  schemasTpe: SchemaTpe[];
  calendrier: VisiteCalendrier[];
  seuils: {
    /** au-delà, TPE VIH en principe hors délai */
    delaiTpeHeures: number;
    /** anti-HBs : répondeur si ≥ seuil (mUI/mL) */
    antiHbsRepondeur: number;
    /** rappel à la victime n jours avant chaque visite (point d'extension, voir lib/aes/rappels.ts) */
    rappelJoursAvant: number;
  };
  /** textes d'aide affichés tels quels (annexes A à G) */
  annexes: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G", { titre: string; entetes: string[]; lignes: LigneAnnexe[]; notes?: string[] }>;
};

export const REFERENTIEL_AES_DEFAUT: ReferentielAes = {
  schemasTpe: [
    { code: "OMS_2024", libelle: "Préféré (OMS 2024)", molecules: "Ténofovir + lamivudine ou emtricitabine + dolutégravir", remarques: "Trithérapie, 28 jours", contientTenofovir: true, actif: true },
    { code: "US_2025", libelle: "Préféré (US 2025)", molecules: "Bictégravir / ténofovir alafénamide / emtricitabine", remarques: "Un comprimé par jour", contientTenofovir: true, actif: true },
    { code: "ALTERNATIF", libelle: "Alternatif", molecules: "Ténofovir + FTC ou 3TC + darunavir boosté", remarques: "Plus d'interactions", contientTenofovir: true, actif: true },
    { code: "POSSIBLE", libelle: "Possible", molecules: "Ténofovir + FTC + raltégravir", remarques: "Plus de comprimés", contientTenofovir: true, actif: true },
    { code: "NEVIRAPINE", libelle: "Contre-indiqué", molecules: "Névirapine", remarques: "Toxicité hépatique", contientTenofovir: false, actif: false },
  ],

  calendrier: [
    {
      code: "J1_J7",
      libelle: "J1–J7",
      decalageJours: 7,
      bilans: [
        { bilan: "VIH", condition: "TOUS" },
        { bilan: "VHC", condition: "TOUS" },
        { bilan: "ALAT", condition: "TOUS" },
        { bilan: "ANTI_HBS", condition: "VACCINE_TITRE_INCONNU" },
        { bilan: "AG_HBS", condition: "NON_VACCINE" },
        { bilan: "ANTI_HBC", condition: "NON_VACCINE" },
        { bilan: "ANTI_HBS", condition: "NON_VACCINE" },
        { bilan: "CREATININE", condition: "TPE" },
        { bilan: "BHCG", condition: "TPE" },
      ],
    },
    {
      code: "S2",
      libelle: "S2",
      decalageJours: 14,
      bilans: [
        { bilan: "ALAT", condition: "TPE_COMORBIDITE" },
        { bilan: "CREATININE", condition: "TPE_COMORBIDITE" },
      ],
    },
    {
      code: "S6",
      libelle: "S6",
      decalageJours: 42,
      bilans: [
        { bilan: "VIH", condition: "S6_VIH" },
        { bilan: "ALAT", condition: "SOURCE_ARN_VHC_POSITIF" },
        { bilan: "ARN_VHC", condition: "SOURCE_ARN_VHC_POSITIF" },
      ],
    },
    {
      code: "S12",
      libelle: "S12",
      decalageJours: 84,
      bilans: [
        { bilan: "VIH", condition: "TOUS" },
        { bilan: "VHC", condition: "TOUS" },
        { bilan: "AG_HBS", condition: "NON_IMMUNISE_SOURCE_HBS" },
        { bilan: "ANTI_HBC", condition: "NON_IMMUNISE_SOURCE_HBS" },
        { bilan: "ANTI_HBS", condition: "NON_IMMUNISE_SOURCE_HBS" },
      ],
    },
  ],

  seuils: { delaiTpeHeures: 72, antiHbsRepondeur: 10, rappelJoursAvant: 3 },

  annexes: {
    A: {
      titre: "Annexe A – Niveau de risque",
      entetes: ["Risque", "Type d'exposition"],
      lignes: [
        ["Important", "Piqûre profonde, aiguille creuse, intravasculaire, matériel visiblement souillé de sang"],
        ["Intermédiaire", "Coupure au bistouri ; piqûre IM ou SC ; aiguille pleine ; contact cutanéo-muqueux prolongé (> 15 min)"],
        ["Minime", "Autres cas : seringue abandonnée, morsure, griffure, projection brève"],
      ],
    },
    B: {
      titre: "Annexe B – Indication du TPE VIH (délai < 72 h)",
      entetes: ["Statut VIH de la source", "Indication"],
      lignes: [
        ["Positif", "TPE recommandé quel que soit le niveau de risque (si charge virale indétectable : décision partagée avec l'expert)"],
        ["Inconnu", "TPE recommandé uniquement si risque important et source à risque : affection opportuniste ou signes évocateurs, partenaires multiples ou HSH, usage de drogues IV, polytransfusion, enfant de mère séropositive"],
        ["Négatif", "Pas de TPE"],
      ],
      notes: ["Le schéma zidovudine + lamivudine + nelfinavir du cours est ancien ; vérifier le schéma en vigueur au P23."],
    },
    C: {
      titre: "Annexe C – TPE VHB",
      entetes: ["Sujet exposé", "Source Ag HBs positive", "Source Ag HBs inconnue"],
      lignes: [
        ["Vacciné répondeur (anti-HBs > 10 mUI/mL, ou > 100 dans les antécédents)", "Rien", "Rien"],
        ["Vacciné non répondeur (anti-HBs < 10 sans anti-HBc ni anti-HBs > 100 dans le passé)", "Immunoglobulines *", "Rien **"],
        ["Non vacciné", "Immunoglobulines * + vaccin", "Vaccin **"],
      ],
      notes: [
        "* Immunoglobulines non nécessaires si ADN VHB indétectable chez la source et ténofovir utilisé dans le TPE.",
        "** Immunoglobulines légitimes sans ténofovir dans le TPE si la source vient d'une zone de haute ou moyenne endémicité, ou est usager de drogues IV, HSH ou a des partenaires multiples. En l'absence d'immunoglobulines : ténofovir 28 jours si pas déjà sous TPE VIH.",
      ],
    },
    D: {
      titre: "Annexe D – Vaccination hépatite B (adulte)",
      entetes: ["Schéma", "Doses", "Indication"],
      lignes: [
        ["Standard", "M0 · M1 · M6", "Cas habituel"],
        ["Accéléré", "J0 · J7 · J21 + rappel M12", "Protection rapide nécessaire"],
        ["Contrôle", "Anti-HBs 1 à 2 mois après la dernière dose", "Tout soignant"],
      ],
    },
    E: {
      titre: "Annexe E – Calendrier de suivi sérologique",
      entetes: ["Moment", "Bilans", "Conditions"],
      lignes: [
        ["J1–J7", "Sérologie VIH · Sérologie VHC · ALAT", "Pour tous"],
        ["", "Anti-HBs", "Si vacciné et titre inconnu"],
        ["", "Ag HBs · Anti-HBc · Anti-HBs", "Si non vacciné"],
        ["", "Créatinine · Test de grossesse", "Si indication de TPE"],
        ["S2", "ALAT · Créatinine", "Si TPE et comorbidité ou crainte de iatrogénie"],
        ["S6", "Sérologie VIH", "Si TPE, ou sans TPE si source VIH inconnue ou VIH+ avec charge virale détectable"],
        ["", "ALAT · ARN VHC", "Si ARN VHC positif chez la source"],
        ["S12", "Sérologie VIH · Sérologie VHC", "Pour tous"],
        ["", "Ag HBs · Anti-HBc · Anti-HBs", "Si victime non immunisée et source Ag HBs+ ou inconnue"],
      ],
    },
    F: {
      titre: "Annexe F – Consultations à programmer",
      entetes: ["Moment", "Objet"],
      lignes: [
        ["J0", "Déclaration, évaluation du risque, prélèvements, TPE si indiqué"],
        ["J3 (≤ 72 h)", "Réévaluation, résultats de la source, arrêt du TPE si source négative"],
        ["S2", "Tolérance et observance du TPE, bilan si indiqué"],
        ["S4 (fin du TPE)", "Bilan de fin de traitement, soutien"],
        ["S6", "Résultats S6"],
        ["S12", "Résultats finaux, clôture si tout est négatif"],
      ],
    },
    G: {
      titre: "Annexe G – Conseils à la victime",
      entetes: ["Conseil", "Durée"],
      lignes: [
        ["Rapports sexuels protégés", "Jusqu'au dernier test VIH (S12)"],
        ["Pas de don de sang, d'organes ou de tissus", "Jusqu'à la fin du suivi"],
        ["Observance stricte du TPE", "28 jours"],
        ["Signaler fièvre, éruption, effets secondaires", "Pendant tout le suivi"],
        ["Allaitement : discuter la suspension avec l'expert", "Jusqu'au dernier test VIH"],
      ],
    },
  },
};

/** Fusionne une valeur stockée en base avec les valeurs par défaut (clé par clé) */
export function fusionnerReferentiel(stocke: Partial<ReferentielAes> | null | undefined): ReferentielAes {
  return {
    schemasTpe: stocke?.schemasTpe ?? REFERENTIEL_AES_DEFAUT.schemasTpe,
    calendrier: stocke?.calendrier ?? REFERENTIEL_AES_DEFAUT.calendrier,
    seuils: { ...REFERENTIEL_AES_DEFAUT.seuils, ...(stocke?.seuils ?? {}) },
    annexes: { ...REFERENTIEL_AES_DEFAUT.annexes, ...(stocke?.annexes ?? {}) },
  };
}
