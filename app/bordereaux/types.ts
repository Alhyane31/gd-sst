export type PersonnelCategorie = "SMR" | "VP";

export type VisiteType = "ANNUELLE" | "RAPPROCHEE";

export type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE";

export type ConvocationType = "INITIALE" | "RELANCE_1" | "RELANCE_2" | "RELANCE_3";

export type PresenceStatut = "PRESENT" | "ABSENT" | "EXCUSE" | "INCONNU";

// si tu veux garder ton wording “état (convoqué + relancé + à convoquer)”
export type EtatWorkflow = "A_CONVOQUER" | "CONVOQUE" | "RELANCE";

export interface PersonnelMini {
  id: string;
  firstName: string;
  lastName: string;
  poste: { id: string; libelle: string };
  service: { id: string; libelle: string };
  formation: { id: string; libelle: string };
  categorie?: PersonnelCategorie;
  tags?: string[];
}

export interface ConvocationRow {
  id: string;
  datePrevue: string; // ISO
  dateRealisee?: string | null; // ISO
  dateConvocation?: string | null; // ISO

  type: VisiteType;
  statut: ConvocationStatut;
  convocationType: ConvocationType;

  presence?: PresenceStatut; // si tu ajoutes plus tard en DB
  etat?: EtatWorkflow;       // optionnel (si tu le gardes séparé de statut)
  commentaire?: string | null;

  personnel: PersonnelMini;
}

export type ApiResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export interface Poste { id: string; libelle: string }
export interface Formation { id: string; libelle: string }
export interface Service { id: string; libelle: string }

export type ConvocationsFilters = {
  // filtres personnel
  nom: string;
  prenom: string;
  posteId: string;
  formationId: string;
  serviceId: string;
  categorie: "" | PersonnelCategorie;
  tag: string; // exact (si API tags.has)

  // filtres visite
  visiteType: "" | VisiteType;
  statut: "" | ConvocationStatut;
  convocationType: "" | ConvocationType;
  presence: "" | PresenceStatut;
  etat: "" | EtatWorkflow;

  // dates (format YYYY-MM-DD)
  dateConvocFrom: string;
  dateConvocTo: string;
  
};
