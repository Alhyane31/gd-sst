// Données renvoyées par GET /api/aes/[visiteId] (dates sérialisées en chaînes)
import type { MembreFamille } from "@/lib/clinique/antecedents";
import type { ReferentielAes } from "@/lib/aes/referentiel";

export type SuiviApi = { id: string; code: string; datePrevue: string; statut: string; bilans: string[] };

export type ConsultationApi = {
  id: string;
  visite: string;
  dateConsultation: string;
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type DeclarationApi = {
  id: string;
  statut: "BROUILLON" | "VALIDEE" | "CLOTUREE";
  data: Record<string, unknown> | null;
  motifArretSuivi: string | null;
  validatedAt: string | null;
  clotureAt: string | null;
  createdAt: string;
  updatedAt: string;
  suivis: SuiviApi[];
  consultations: ConsultationApi[];
};

export type DossierAesApi = {
  visite: {
    id: string;
    type: string;
    statut: string;
    dateDebut: string;
    personnel: {
      id: string;
      firstName: string;
      lastName: string;
      matricule: string | null;
      dateNaissance: string | null;
      sexe: string | null;
      statutSocial: string | null;
      poste: { libelle: string } | null;
      service: { libelle: string } | null;
      formation: { libelle: string } | null;
    };
  };
  dossier: {
    formulaireDu: string | null;
    pathologies: { code: string; libelle: string; date: string; commentaire: string | null }[];
    synthese: string;
    antecedentsChirurgicaux: string;
    antecedentsFamiliaux: MembreFamille[];
    antecedentsProfessionnels: Record<string, unknown>;
    nombreEnfants: string;
  };
  declaration: DeclarationApi | null;
  referentiel: ReferentielAes;
};
