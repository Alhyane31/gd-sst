// app/formulaires/components/types.ts
export type OuiNon = "oui" | "non";

export type FormSectionKey =
  | "INFORMATIONS_GENERALES"
  | "INFORMATIONS_PROFESSIONNELLES"
  | "RENSEIGNEMENTS_PROFESSIONNELS"
  | "ANTECEDENTS";

export type Cim11Option = {
  id: string;
  code: string;
  libelle: string;
};
export type PathologieItem = {
  cim11Code: string;
  cim11Libelle: string;
  date: string; // yyyy-mm-dd
  commentaire?: string;
  source?: string; // surtout utile dans l'historique
};
export type FormData = {
  // INFORMATIONS_GENERALES
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO yyyy-mm-dd
  statutSocial: string;
  matricule: string;

  // INFORMATIONS_PROFESSIONNELLES
  formation: string;
  service: string;
  dateAffectationChu: string; // ISO yyyy-mm-dd
  autreEtablissement: OuiNon;
  lieuTravail: string;
  dureeAnnees: string; // string pour TextField, convert côté API
  horaires: string;

  // RENSEIGNEMENTS_PROFESSIONNELS
  travailGarde: OuiNon;
  heuresGarde: string;
  rythmeGarde: string;

  travailNuit: OuiNon;
  nbNuitsMois: string;
  horairesNuit: string;

  // ANTECEDENTS
  pathologiesHistory: PathologieItem[]; // read-only (vient du backend)
  pathologiesToAdd: PathologieItem[];   // editable (ajouts du formulaire)

  antecedents: string;
};

export type ChangeHandler = <K extends keyof FormData>(
  name: K,
  value: FormData[K]
) => void;