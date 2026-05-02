// app/formulaires/components/types.ts
export type OuiNon = "oui" | "non";

export type FormSectionKey =
  | "INFORMATIONS_GENERALES"
  | "INFORMATIONS_PROFESSIONNELLES"
  | "RENSEIGNEMENTS_PROFESSIONNELS"
  | "ANTECEDENTS"
  | "SUIVI_RAPPROCHE";

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
  motifConsultation?: string;
  typeVisite?: "ANNUELLE" | "RAPPROCHEE" | "";

  // INFORMATIONS_PROFESSIONNELLES
   formation: string;
  formationId?: string;

  service: string;
  serviceId?: string;

  poste: string;
  posteId?: string;

  detailPoste: string;
  detailPosteId?: string;

  categorieForm?: "A" | "B" | "C"| "";
  
  dateAffectationChu: string; // ISO yyyy-mm-dd
  autreEtablissement: OuiNon;
  lieuTravail: string;
  dureeAnnees: string; // string pour TextField, convert côté API
  horaires: string;

  // RENSEIGNEMENTS_PROFESSIONNELS
  travailGarde: OuiNon;
  heuresGarde: string;
  rythmeGarde: string;
horairesTravail?: "SEMAINE_STANDARD" | "SEMAINE_ATYPIQUE" | "";
  horaireTravailPrecision?: "08H00_14H00" | "08H00_16H00" | "14H00_20H00" | "";
 formesHoraireAtypique?: string[];
  travailNuit: OuiNon;
  nbNuitsMois: string;
  horairesNuit: string;
posteNuitFixe?: "oui" | "non" | "";
rythmeTravailNuit?: "3x8" | "2x12" | "ROULEMENT_HEBDOMADAIRE" | "ROULEMENT_MENSUEL" | "";
heuresNuitMois?: string;
joursReposAnnee?: string;
  // ANTECEDENTS
  pathologiesHistory: PathologieItem[]; // read-only (vient du backend)
  pathologiesToAdd: PathologieItem[];   // editable (ajouts du formulaire)

  antecedents: string;

  necessitatSuiviRapproche: boolean | null;
  motifsSuiviRapproche: string[];
  prochainVisiteMois: number | null;
  nePlusNecessiterSuivi?: boolean | null;
};

export type ChangeHandler = <K extends keyof FormData>(
  name: K,
  value: FormData[K]
) => void;