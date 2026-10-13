// Contrôleur central : modifier ici pour changer les sections d'un type de visite
// sans toucher au stepper ni aux composants de sections.

import type { FormData, FormSectionKey } from "./components/types";
import { S4_PLAIE, S5_PROJECTION } from "@/app/aes/config/declaration";

export type VisiteType =
  | "ANNUELLE"
  | "RAPPROCHEE"
  | "SPONTANNE"
  | "CM"
  | "EXPERTISE"
  | "ETUDEP"
  | "LD"
  | "MD"
  | "EMBAUCHE"
  | "AES"
  | "AUTRE";

export type SectionConfig = {
  key: FormSectionKey;
  label: string;
  /** étape affichée selon les réponses (ex. AES : plaie ou projection selon le type d'exposition) */
  when?: (data: FormData) => boolean;
};

const S_INFOS_GENERALES:        SectionConfig = { key: "INFORMATIONS_GENERALES",        label: "Informations générales" };
const S_PARCOURS_ACADEMIQUE:    SectionConfig = { key: "PARCOURS_ACADEMIQUE",           label: "Parcours académique" };
const S_INFOS_PRO:            SectionConfig = { key: "INFORMATIONS_PROFESSIONNELLES", label: "Informations professionnelles" };
const S_RENS_PRO:               SectionConfig = { key: "RENSEIGNEMENTS_PROFESSIONNELS", label: "Renseignements professionnels" };
const S_ACTIVITES_CONTRAINTES:  SectionConfig = { key: "ACTIVITES_CONTRAINTES_PROFESSIONNELLES", label: "Activités et contraintes professionnelles" };
const S_ANTECEDENTS:            SectionConfig = { key: "ANTECEDENTS",                   label: "Antécédents" };
const S_CONSTANTES:             SectionConfig = { key: "CONSTANTES",                    label: "Constantes" };
const S_EXAMEN_CLINIQUE:        SectionConfig = { key: "EXAMEN_CLINIQUE_APTITUDE",      label: "Examen clinique" };
const S_PARACLINIQUE:           SectionConfig = { key: "EXAMEN_PARACLINIQUE",           label: "Examen paraclinique" };
const S_SUIVI_RAPPROCHE:        SectionConfig = { key: "SUIVI_RAPPROCHE",               label: "Décision d'aptitude et suivi" };
const S_CERTIFICAT_MEDICALE:    SectionConfig = { key: "CERTIFICAT_MEDICALE",           label: "Certificat médical" };
const S_IDENTIFICATION_EXPERTISE: SectionConfig = { key: "IDENTIFICATION_EXPERTISE",   label: "Identification expertise" };
const S_RESULTAT_EXPERTISE:     SectionConfig = { key: "RESULTAT_EXPERTISE",            label: "Résultat de l'expertise" };

// Visite AES : sections de la déclaration (docs/Module_AES_specifications.md)
const aes = (data: FormData) => (data.aes ?? {}) as Record<string, unknown>;
const SECTIONS_AES: SectionConfig[] = [
  { key: "AES_CIRCONSTANCES",   label: "AES – Circonstances" },
  { key: "AES_GESTE",           label: "AES – Le geste en cause" },
  { key: "AES_EXPOSITION",      label: "AES – Type d'exposition" },
  { key: "AES_PLAIE",           label: "AES – Description de la plaie", when: (d) => !!S4_PLAIE.when?.(aes(d), {}) },
  { key: "AES_PROJECTION",      label: "AES – Description de la projection", when: (d) => !!S5_PROJECTION.when?.(aes(d), {}) },
  { key: "AES_CONDUITE",        label: "AES – Conduite immédiate" },
  { key: "AES_SOURCE",          label: "AES – Patient source" },
  { key: "AES_VHB",             label: "AES – Statut vaccinal VHB" },
  { key: "AES_PRISE_EN_CHARGE", label: "AES – Prise en charge" },
  { key: "AES_CALENDRIER",      label: "AES – Calendrier de suivi" },
  { key: "AES_CONSULTATIONS",   label: "AES – Consultations de résultats" },
];

const SECTIONS_STANDARD: SectionConfig[] = [
  S_INFOS_GENERALES,
  S_INFOS_PRO,
  S_RENS_PRO,
  S_ACTIVITES_CONTRAINTES,
  S_ANTECEDENTS,
  S_CONSTANTES,
  S_EXAMEN_CLINIQUE,
  S_PARACLINIQUE,
  S_SUIVI_RAPPROCHE,
];

export const VISITE_SECTIONS: Record<VisiteType, SectionConfig[]> = {
  ANNUELLE:   SECTIONS_STANDARD,
  RAPPROCHEE: SECTIONS_STANDARD,
  SPONTANNE:  SECTIONS_STANDARD,
  ETUDEP:     SECTIONS_STANDARD,
  LD:         SECTIONS_STANDARD,
  MD:         SECTIONS_STANDARD,
  AUTRE:      SECTIONS_STANDARD,

  // Visite AES : renseignements personnels et antécédents (modifiables), puis la déclaration AES
  AES: [S_INFOS_GENERALES, S_INFOS_PRO, S_ANTECEDENTS, ...SECTIONS_AES],

  // Visite d'embauche : seule visite avec le parcours académique
  EMBAUCHE: [
    S_INFOS_GENERALES,
    S_PARCOURS_ACADEMIQUE,
    S_INFOS_PRO,
    S_RENS_PRO,
    S_ACTIVITES_CONTRAINTES,
    S_ANTECEDENTS,
    S_CONSTANTES,
    S_EXAMEN_CLINIQUE,
    S_PARACLINIQUE,
    S_SUIVI_RAPPROCHE,
  ],

  CM: [
    S_INFOS_GENERALES,
    S_INFOS_PRO,
    S_RENS_PRO,
    S_ACTIVITES_CONTRAINTES,
    S_ANTECEDENTS,
    S_CONSTANTES,
    S_EXAMEN_CLINIQUE,
    S_PARACLINIQUE,
    S_CERTIFICAT_MEDICALE,
  ],

  EXPERTISE: [
    S_INFOS_GENERALES,
    S_IDENTIFICATION_EXPERTISE,
    S_INFOS_PRO,
    S_RENS_PRO,
    S_ACTIVITES_CONTRAINTES,
    S_ANTECEDENTS,
    S_CONSTANTES,
    S_EXAMEN_CLINIQUE,
    S_PARACLINIQUE,
    S_RESULTAT_EXPERTISE,
  ],
};

/** Étapes affichées pour un formulaire (sections conditionnelles filtrées) */
export function getVisibleSections(data: FormData): SectionConfig[] {
  return getSectionsForVisiteType(data.typeVisite).filter((s) => !s.when || s.when(data));
}

/** Section de la déclaration AES correspondant à une étape du formulaire */
export const AES_SECTION_PAR_ETAPE: Partial<Record<FormSectionKey, string>> = {
  AES_CIRCONSTANCES: "circonstances",
  AES_GESTE: "geste",
  AES_EXPOSITION: "exposition",
  AES_PLAIE: "plaie",
  AES_PROJECTION: "projection",
  AES_CONDUITE: "conduite",
  AES_SOURCE: "source",
  AES_VHB: "vhb",
  AES_PRISE_EN_CHARGE: "priseEnCharge",
};

export function getSectionsForVisiteType(type?: string | null): SectionConfig[] {
  if (!type) return SECTIONS_STANDARD;
  return VISITE_SECTIONS[type as VisiteType] ?? SECTIONS_STANDARD;
}
