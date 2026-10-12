// Examen clinique structuré (4.1 → 4.14), dans l'ordre d'affichage.
import type { SectionDef } from "../types";
import {
  BUCCO_DENTAIRE,
  CARDIOVASCULAIRE,
  COU_THYROIDE,
  DIGESTIF,
  NEUROLOGIQUE,
  OPHTALMOLOGIE,
  ORL,
  PLEUROPULMONAIRE,
  TEGUMENTS,
} from "./appareils";
import { COUDES, EPAULES, POIGNETS_MAINS } from "./membreSuperieur";
import { MEMBRE_INFERIEUR } from "./membreInferieur";
import { RACHIS_CERVICAL, RACHIS_DORSAL, RACHIS_LOMBAIRE } from "./rachis";

export type GroupeExamen = { groupe: string; sections: SectionDef[] };

export const EXAMEN_CLINIQUE: GroupeExamen[] = [
  {
    groupe: "Appareil locomoteur",
    sections: [EPAULES, COUDES, POIGNETS_MAINS, RACHIS_CERVICAL, RACHIS_DORSAL, RACHIS_LOMBAIRE, MEMBRE_INFERIEUR],
  },
  {
    groupe: "Autres appareils",
    sections: [CARDIOVASCULAIRE, DIGESTIF, PLEUROPULMONAIRE, NEUROLOGIQUE],
  },
  {
    groupe: "Téguments, ORL, yeux, cou et bouche",
    sections: [TEGUMENTS, ORL, OPHTALMOLOGIE, COU_THYROIDE, BUCCO_DENTAIRE],
  },
];
