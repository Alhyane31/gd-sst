// Examen clinique structuré (4.1 → 4.14), dans l'ordre d'affichage.
import type { SectionDef } from "../types";
import { COUDES, EPAULES, POIGNETS_MAINS } from "./membreSuperieur";
import { MEMBRE_INFERIEUR } from "./membreInferieur";
import { RACHIS_CERVICAL, RACHIS_DORSAL, RACHIS_LOMBAIRE } from "./rachis";

export type GroupeExamen = { groupe: string; sections: SectionDef[] };

export const EXAMEN_CLINIQUE: GroupeExamen[] = [
  {
    groupe: "Appareil locomoteur",
    sections: [EPAULES, COUDES, POIGNETS_MAINS, RACHIS_CERVICAL, RACHIS_DORSAL, RACHIS_LOMBAIRE, MEMBRE_INFERIEUR],
  },
];
