// Contrôleur central : modifier ici pour changer les sections d'un type de visite
// sans toucher au stepper ni aux composants de sections.

import type { FormSectionKey } from "./components/types";

export type VisiteType =
  | "ANNUELLE"
  | "RAPPROCHEE"
  | "SPONTANNE"
  | "CM"
  | "EXPERTISE"
  | "ETUDEP"
  | "LD"
  | "MD"
  | "AUTRE";

export type SectionConfig = {
  key: FormSectionKey;
  label: string;
};

const S_INFOS_GENERALES:        SectionConfig = { key: "INFORMATIONS_GENERALES",        label: "Informations générales" };
const S_INFOS_PRO:              SectionConfig = { key: "INFORMATIONS_PROFESSIONNELLES", label: "Informations professionnelles" };
const S_RENS_PRO:               SectionConfig = { key: "RENSEIGNEMENTS_PROFESSIONNELS", label: "Renseignements professionnels" };
const S_ANTECEDENTS:            SectionConfig = { key: "ANTECEDENTS",                   label: "Antécédents" };
const S_SUIVI_RAPPROCHE:        SectionConfig = { key: "SUIVI_RAPPROCHE",               label: "Suivi rapproché" };
const S_CERTIFICAT_MEDICALE:    SectionConfig = { key: "CERTIFICAT_MEDICALE",           label: "Certificat médical" };
const S_IDENTIFICATION_EXPERTISE: SectionConfig = { key: "IDENTIFICATION_EXPERTISE",   label: "Identification expertise" };
const S_RESULTAT_EXPERTISE:     SectionConfig = { key: "RESULTAT_EXPERTISE",            label: "Résultat de l'expertise" };

const SECTIONS_STANDARD: SectionConfig[] = [
  S_INFOS_GENERALES,
  S_INFOS_PRO,
  S_RENS_PRO,
  S_ANTECEDENTS,
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

  CM: [
    S_INFOS_GENERALES,
    S_INFOS_PRO,
    S_RENS_PRO,
    S_ANTECEDENTS,
    S_CERTIFICAT_MEDICALE,
  ],

  EXPERTISE: [
    S_INFOS_GENERALES,
    S_IDENTIFICATION_EXPERTISE,
    S_INFOS_PRO,
    S_RENS_PRO,
    S_ANTECEDENTS,
    
    
    S_RESULTAT_EXPERTISE,
  ],
};

export function getSectionsForVisiteType(type?: string | null): SectionConfig[] {
  if (!type) return SECTIONS_STANDARD;
  return VISITE_SECTIONS[type as VisiteType] ?? SECTIONS_STANDARD;
}
