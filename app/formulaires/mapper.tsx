import type { FormData } from "@/app/formulaires/components/types";

const emptyData: FormData = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  statutSocial: "",
  matricule: "",

  formation: "",
  service: "",
  dateAffectationChu: "",
  autreEtablissement: "non",
  lieuTravail: "",
  dureeAnnees: "",
  horaires: "",

  travailGarde: "non",
  heuresGarde: "",
  rythmeGarde: "",

  travailNuit: "non",
  nbNuitsMois: "",
  horairesNuit: "",

  pathologiesHistory: [],
  pathologiesToAdd: [],
  antecedents: "",
  necessitatSuiviRapproche: null,
nePlusNecessiterSuivi:    null,
motifsSuiviRapproche:     [],
prochainVisiteMois:       null,
};

function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

export function mapApiToFormData(payload: any): FormData {
  const p = payload?.personnel;
  const f = payload?.formulaire;
  const raw = f?.data?.raw ?? {};
  const rp = f?.data?.renseignementsProfessionnels ?? {};

  // ✅ sécurité: si absent, renvoyer empty
  if (!p || !f) return { ...emptyData };

  return {
    ...emptyData,

    // ---- INFORMATIONS GENERALES ----
    nom: f.snapshotLastName ?? p.lastName ?? "",
    prenom: f.snapshotFirstName ?? p.firstName ?? "",
    dateNaissance: toDateInput(f.dateNaissance ?? p.dateNaissance),
    statutSocial: (f.statutSocial ?? p.statutSocial ?? "") as any,
    matricule: f.snapshotMatricule ?? p.matricule ?? "",
    typeVisite: payload?.visite.type,
    // ---- INFORMATIONS PROFESSIONNELLES ----
    formation: f.formation?.libelle ?? p.formation?.libelle ?? "",
formationId: f.formationId ?? p.formationId ?? p.formation?.id ?? "",

service: f.service?.libelle ?? p.service?.libelle ?? "",
serviceId: f.serviceId ?? p.serviceId ?? p.service?.id ?? "",
posteId:      f.renseignementsProfessionnels?.posteId   // pas là
           ?? raw?.posteId                               // ✅ source correcte
           ?? p.posteId ?? p.poste?.id ?? "",

detailPosteId: raw?.detailPosteId
             ?? p.posteDetailId ?? p.posteDetail?.id ?? "",

detailPoste:  raw?.detailPoste ?? p.posteDetail?.libelle ?? "",
poste:        raw?.poste       ?? p.poste?.libelle       ?? "",

categorieForm: p.poste?.categorieForm ?? "",
    dateAffectationChu: toDateInput(f.dateAffectation ?? p.dateAffectation ?? raw?.dateAffectationChu),

    autreEtablissement:
      f.aTravailleHorsCHUIR == null
        ? (raw?.autreEtablissement ?? "non")
        : f.aTravailleHorsCHUIR
        ? "oui"
        : "non",

    lieuTravail: f.autreLieuTravail ?? raw?.lieuTravail ?? "",
    dureeAnnees:
      f.autreDureeAnnees == null
        ? (raw?.dureeAnnees ?? "")
        : String(f.autreDureeAnnees),
    horaires: f.autreHoraires ?? raw?.horaires ?? "",

    // ---- RENSEIGNEMENTS PRO ----
    travailGarde: rp?.travailGarde ?? raw?.travailGarde ?? "non",
    heuresGarde: rp?.heuresGarde ?? raw?.heuresGarde ?? "",
    rythmeGarde: rp?.rythmeGarde ?? raw?.rythmeGarde ?? "",

    travailNuit: rp?.travailNuit ?? raw?.travailNuit ?? "non",
    nbNuitsMois: rp?.nbNuitsMois ?? raw?.nbNuitsMois ?? "",
    horairesNuit: rp?.horairesNuit ?? raw?.horairesNuit ?? "",
formesHoraireAtypique: Array.isArray(rp?.formesHoraireAtypique)
  ? rp.formesHoraireAtypique
  : Array.isArray(raw?.formesHoraireAtypique)
  ? raw.formesHoraireAtypique
  : [],
  posteNuitFixe: rp?.posteNuitFixe ?? raw?.posteNuitFixe ?? "",
rythmeTravailNuit: rp?.rythmeTravailNuit ?? raw?.rythmeTravailNuit ?? "",
heuresNuitMois: rp?.heuresNuitMois ?? raw?.heuresNuitMois ?? "",
joursReposAnnee: rp?.joursReposAnnee ?? raw?.joursReposAnnee ?? "",
    // ---- ANTECEDENTS ----
    pathologiesHistory: (f.pathologies ?? []).map((x: any) => ({
      cim11Code: x.cim11?.code ?? "",
      cim11Libelle: x.cim11?.libelle ?? "",
      date: toDateInput(x.date),
      commentaire: x.commentaire ?? "",
      source: x.source ?? "",
    // ---- SUIVI RAPPROCHÉ ----
necessitatSuiviRapproche: f.necessitatSuiviRapproche ?? null,
nePlusNecessiterSuivi:    f.nePlusNecessiterSuivi    ?? null,
motifsSuiviRapproche:     Array.isArray(f.motifsSuiviRapproche)
  ? f.motifsSuiviRapproche
  : [],
prochainVisiteMois: f.prochainVisiteMois != null
  ? Number(f.prochainVisiteMois)
  : null,

    })),

    pathologiesToAdd: Array.isArray(f?.data?.pathologiesToAdd)
      ? f.data.pathologiesToAdd
      : Array.isArray(raw?.pathologiesToAdd)
      ? raw.pathologiesToAdd
      : [],

    antecedents: (f.data?.antecedents as string) ?? raw?.antecedents ?? "",
  };
}