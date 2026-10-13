// Référentiel AES paramétrable (table AesReferentiel). Valeurs par défaut = annexes de la spécification V2
// (docs/Module_AES_specifications_V2.md). Le protocole du P23 prime : tout est modifiable depuis /referentiels/aes.
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
  SOURCE_VHC_POSITIF: "Si source VHC positive (ARN VHC chez la source)",
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
    /** TPE VIH « au plus tard » (heures) : au-delà, hors délai */
    delaiTpeHeures: number;
    /** délai optimal de prise en charge (heures) */
    delaiOptimalHeures: number;
    /** déclaration au service et déclaration AT : dans ce délai (heures) */
    delaiDeclarationHeures: number;
    /** anti-HBs : répondeur si titre STRICTEMENT supérieur (mUI/mL) ; égal = non-répondeur */
    antiHbsRepondeur: number;
    /** rappel à la victime n jours avant chaque visite (point d'extension, voir lib/aes/rappels.ts) */
    rappelJoursAvant: number;
  };
  /** textes d'aide affichés tels quels (annexes A à G) */
  annexes: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G", { titre: string; entetes: string[]; lignes: LigneAnnexe[]; notes?: string[] }>;
};

export const REFERENTIEL_AES_DEFAUT: ReferentielAes = {
  schemasTpe: [
    {
      code: "COURS",
      libelle: "Cours",
      molecules: "2 INTI : zidovudine + lamivudine (Combivir®) + 1 IP : nelfinavir (Viracept®) ou ritonavir (Norvir®)",
      remarques: "Effets secondaires +++ ; référence d'enseignement",
      contientTenofovir: false,
      actif: false,
    },
    { code: "OMS_2024", libelle: "Actuel (OMS 2024)", molecules: "Ténofovir + lamivudine ou emtricitabine + dolutégravir", remarques: "Trithérapie, 28 jours ; mieux tolérée", contientTenofovir: true, actif: true },
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
        // V2, partie 2 : source VHC positive → ALAT et ARN VHC à S6 (couvre aussi « ARN VHC positif » de l'annexe E)
        { bilan: "ALAT", condition: "SOURCE_VHC_POSITIF" },
        { bilan: "ARN_VHC", condition: "SOURCE_VHC_POSITIF" },
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

  seuils: { delaiTpeHeures: 48, delaiOptimalHeures: 4, delaiDeclarationHeures: 24, antiHbsRepondeur: 10, rappelJoursAvant: 3 },

  annexes: {
    A: {
      titre: "Annexe A – Niveau de risque",
      entetes: ["Risque", "Type d'exposition"],
      lignes: [
        ["Important", "Piqûre profonde, aiguille creuse, dispositif intravasculaire (artériel ou veineux)"],
        ["Intermédiaire", "Coupure avec bistouri ; piqûre avec aiguille IM ou SC ; piqûre avec aiguille pleine ; exposition cutanéo-muqueuse avec temps de contact > 15 min"],
        ["Minime", "Autres cas ; morsures ou griffures"],
        ["Pas d'AES", "Projection sur peau saine ; urines ou selles non souillées de sang"],
      ],
    },
    B: {
      titre: "Annexe B – Indication du TPE VIH (au mieux < 4 h, au plus tard 48 h)",
      entetes: ["Statut VIH de la source", "Indication"],
      lignes: [
        ["Positif", "Risque important ou intermédiaire : TPE recommandé. Risque minime : TPE non recommandé."],
        [
          "Inconnu",
          "Risque important : TPE recommandé uniquement si source ou situation reconnue à risque (affection opportuniste majeure ou signes évocateurs, partenaires multiples, homo- ou bisexuel, usage de drogues IV, polytransfusion, enfant né de mère séropositive). Risque intermédiaire ou minime : TPE non recommandé.",
        ],
        ["Négatif", "Pas de TPE"],
      ],
      notes: ["Le schéma du cours reste la référence d'enseignement ; la liste des schémas est paramétrable pour suivre le protocole en vigueur au P23."],
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
        "** Immunoglobulines légitimes en l'absence de ténofovir dans le TPE et si la source est originaire d'un pays de haute (Afrique subsaharienne, Asie) ou moyenne (Outre-mer, Europe de l'Est et du Sud, Afrique du Nord, Moyen-Orient, sous-continent indien, Amérique du Sud) endémicité pour le VHB et/ou usager de drogues IV et/ou HSH et/ou avec partenaires multiples.",
      ],
    },
    D: {
      titre: "Annexe D – Vaccination hépatite B (adulte)",
      entetes: ["Schéma", "Doses", "Indication"],
      lignes: [
        ["Standard", "M0 · M1 · M6", "Cas habituel"],
        ["Accéléré", "J0 · J7 · J21 + rappel M12", "Protection rapide nécessaire"],
        ["Contrôle", "Anti-HBs 1 mois après la dernière dose", "Tout soignant ; protégé si > 10 mUI/mL"],
        ["Non-répondeur", "Anti-HBs < 10 mUI/mL 1 mois après le rappel : doses supplémentaires", "Contrôle après chaque dose"],
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
        ["J2–J3 (48–72 h)", "Réévaluation par le médecin référent, résultats de la source, arrêt du TPE si source négative"],
        ["S2", "Tolérance et observance du TPE, bilan si indiqué"],
        ["S4 (fin du TPE)", "Bilan de fin de traitement, soutien"],
        ["1er mois", "Soutien psychologique : 3 entretiens"],
        ["S6", "Résultats S6"],
        ["S12", "Résultats finaux, clôture si tout est négatif"],
      ],
    },
    G: {
      titre: "Annexe G – Conseils à la victime",
      entetes: ["Conseil", "Durée"],
      lignes: [
        ["Rapports sexuels protégés", "Jusqu'au dernier test VIH"],
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
