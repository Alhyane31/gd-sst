// app/formulaires/components/types.ts
export type OuiNon = "oui" | "non";

export type FormSectionKey =
  | "INFORMATIONS_GENERALES"
  | "INFORMATIONS_PROFESSIONNELLES"
  | "RENSEIGNEMENTS_PROFESSIONNELS"
  | "ACTIVITES_CONTRAINTES_PROFESSIONNELLES"
  | "ANTECEDENTS"
  | "EXAMEN_CLINIQUE_APTITUDE"
  | "SUIVI_RAPPROCHE"
  | "CERTIFICAT_MEDICALE"
  | "IDENTIFICATION_EXPERTISE"
  | "RESULTAT_EXPERTISE";

export type Cim11Option = {
  id: string;
  code: string;
  libelle: string;
  level: string;
  isLeaf: boolean;
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
  typeVisite?: "ANNUELLE" | "RAPPROCHEE" | "SPONTANNE" | "CM" | "EXPERTISE" | "ETUDEP" | "LD" | "MD" | "AUTRE" | "";

  // INFORMATIONS_PROFESSIONNELLES
   formation: string;
  formationId?: string;

  service: string;
  serviceId?: string;

  poste: string;
  posteId?: string;

  detailPoste: string;
  detailPosteId?: string;

  categorieForm?: "A" | "B" | "C" | "D" | "";
  
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

  // ACTIVITES ET CONTRAINTES PROFESSIONNELLES
  nombrePersonnelsEquipe: string;
  tachesProfessionnelles: string;
  presenceAideTechnique: OuiNon;
  posturesPredominantes: "ASSISE_PROLONGEE" | "DEBOUT_PROLONGEE" | "PAS_DE_POSITION_PROLONGEE" | "";
  presenceContraintes: OuiNon;
  typesContraintes: string[];

  // ANTECEDENTS
  pathologiesHistory: PathologieItem[]; // read-only (vient du backend)
  pathologiesToAdd: PathologieItem[];   // editable (ajouts du formulaire)

  antecedents: string;

  // EXAMEN CLINIQUE ET PARACLINIQUES
  examenCliniqueComplet: string;
  examensPracliniques: string;
  diagnosticsAnterieurs: string;
  maladiesDecouvertes: string;
  diagnosticsSuspectes: string;
  decisionAptitude: "APTE" | "APTE_AVEC_RESTRICTIONS" | "INAPTE_AVEC_RECLASSEMENT" | "";
  recommandations: string;

  necessitatSuiviRapproche: boolean | null;
  motifsSuiviRapproche: string[];
  prochainVisiteMois: number | null;
  nePlusNecessiterSuivi?: boolean | null;

  // CERTIFICAT_MEDICALE
  cmTypeCertificat: "ARRET_TRAVAIL" | "REPRISE_TRAVAIL" | "CONGE_MMD" | "CONGE_MLD" | "DISPONIBILITE_SANTE" | "AUTRE" | "";
  cmDateDebut: string;       // ISO yyyy-mm-dd
  cmDateFin: string;         // ISO yyyy-mm-dd
  cmNombreJours: string;     // durée en jours
  cmDiagnostic: string;      // motif / diagnostic succinct
  cmAvisSst: "CONFORME" | "NON_CONFORME" | "A_VERIFIER" | "";
  cmRecommandations: string; // recommandations SST

  // IDENTIFICATION_EXPERTISE
  expertiseDateReception: string; // ISO yyyy-mm-dd
  expertiseSource: "CHEF_SERVICE" | "PERSONNEL" | "COMMISSION_MEDICALE" | "DIRECTION" | "SERVICE_SANTE_TRAVAIL" | "";
  expertiseMotif: "EVALUATION_APTITUDE" | "MUTATION_SANTE" | "RETRAITE_ANTICIPEE" | "ABSENCE_SANTE" | "REPRISE_ARRET_PSYCHIATRIQUE" | "DISPONIBILITE_SANTE" | "CONGE_MMD" | "CONGE_MLD" | "";

  // RESULTAT_EXPERTISE
  expertiseConclusion: string;
  expertiseDecision: "AMENAGEMENT_POSTE" | "RECLASSEMENT_PROFESSIONNEL" | "PAS_AMENAGEMENT" | "DECISION_DIFFEREE" | "APTITUDE_REPRISE" | "INAPTITUDE_REPRISE" | "";
  expertiseAmenagementRecommandations: string; // Q92
  expertiseReclassementPoste: string;          // Q93
  expertiseCertificatRepriseUrl: string;       // Q94
  expertiseDateTransmission: string;           // Q95 ISO yyyy-mm-dd
};

export type ChangeHandler = <K extends keyof FormData>(
  name: K,
  value: FormData[K]
) => void;