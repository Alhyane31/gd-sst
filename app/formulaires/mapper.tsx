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
  return d.toISOString().slice(0, 10);
}

export function mapApiToFormData(payload: any): FormData {
  const p = payload?.personnel;
  const f = payload?.formulaire;
  const raw = f?.data?.raw ?? {};
  const rp = f?.renseignementsProfessionnels ?? f?.data?.renseignementsProfessionnels ?? {};

  if (!p || !f) return { ...emptyData };

  return {
    ...emptyData,

    // ---- INFORMATIONS GENERALES ----
    nom:           f.nom           ?? f.snapshotLastName  ?? p.lastName  ?? "",
    prenom:        f.prenom        ?? f.snapshotFirstName ?? p.firstName ?? "",
    matricule:     f.matricule     ?? f.snapshotMatricule ?? p.matricule ?? "",
    dateNaissance: toDateInput(f.dateNaissance ?? p.dateNaissance),
    statutSocial:  (f.statutSocial ?? p.statutSocial ?? "") as any,
    typeVisite:    payload?.visite.type,

    // ---- INFORMATIONS PROFESSIONNELLES ----
    formation:   f.formation?.libelle ?? p.formation?.libelle ?? "",
    formationId: f.formationId        ?? p.formationId        ?? p.formation?.id ?? "",

    service:   f.service?.libelle ?? p.service?.libelle ?? "",
    serviceId: f.serviceId        ?? p.serviceId        ?? p.service?.id ?? "",

    posteId:      f.posteId      ?? raw?.posteId      ?? p.posteId      ?? p.poste?.id      ?? "",
    poste:        f.poste        ?? raw?.poste        ?? p.poste?.libelle                    ?? "",
    detailPosteId: f.detailPosteId ?? raw?.detailPosteId ?? p.posteDetailId ?? p.posteDetail?.id ?? "",
    detailPoste:   f.detailPoste   ?? raw?.detailPoste   ?? p.posteDetail?.libelle             ?? "",

    categorieForm: p.poste?.categorieForm ?? "",

    dateAffectationChu: toDateInput(f.dateAffectation ?? p.dateAffectation ?? raw?.dateAffectationChu),

    autreEtablissement:
      f.aTravailleHorsCHUIR == null
        ? (raw?.autreEtablissement ?? "non")
        : f.aTravailleHorsCHUIR ? "oui" : "non",

    lieuTravail: f.autreLieuTravail ?? raw?.lieuTravail ?? "",
    dureeAnnees: f.autreDureeAnnees == null
      ? (raw?.dureeAnnees ?? "")
      : String(f.autreDureeAnnees),
    horaires: f.autreHoraires ?? raw?.horaires ?? "",

    // ---- RENSEIGNEMENTS PRO ----
    travailGarde:           rp?.travailGarde           ?? raw?.travailGarde           ?? "non",
    heuresGarde:            rp?.heuresGarde            ?? raw?.heuresGarde            ?? "",
    rythmeGarde:            rp?.rythmeGarde            ?? raw?.rythmeGarde            ?? "",
    horairesTravail:        rp?.horairesTravail        ?? raw?.horairesTravail        ?? "",
    horaireTravailPrecision: rp?.horaireTravailPrecision ?? raw?.horaireTravailPrecision ?? "",
    formesHoraireAtypique: Array.isArray(rp?.formesHoraireAtypique)
      ? rp.formesHoraireAtypique
      : Array.isArray(raw?.formesHoraireAtypique)
      ? raw.formesHoraireAtypique
      : [],

    travailNuit:      rp?.travailNuit      ?? raw?.travailNuit      ?? "non",
    nbNuitsMois:      rp?.nbNuitsMois      ?? raw?.nbNuitsMois      ?? "",
    horairesNuit:     rp?.horairesNuit     ?? raw?.horairesNuit     ?? "",
    posteNuitFixe:    rp?.posteNuitFixe    ?? raw?.posteNuitFixe    ?? "",
    rythmeTravailNuit: rp?.rythmeTravailNuit ?? raw?.rythmeTravailNuit ?? "",
    heuresNuitMois:   rp?.heuresNuitMois   ?? raw?.heuresNuitMois   ?? "",
    joursReposAnnee:  rp?.joursReposAnnee  ?? raw?.joursReposAnnee  ?? "",

    // ---- ANTECEDENTS ----
    pathologiesHistory: (p.pathologiesHistory ?? p.pathologies ?? []).map((x: any) => ({
      cim11Code:    x.cim11?.code    ?? "",
      cim11Libelle: x.cim11?.libelle ?? "",
      date:         toDateInput(x.date),
      commentaire:  x.commentaire    ?? "",
      source:       x.source         ?? "",
    })),

    pathologiesToAdd: Array.isArray(f.pathologiesToAdd)
      ? f.pathologiesToAdd.map((x: any) => ({
          cim11Code:    x.cim11Code    ?? "",
          cim11Libelle: x.cim11Libelle ?? "",
          date:         toDateInput(x.date),
          commentaire:  x.commentaire  ?? "",
          source:       x.source       ?? "",
        }))
      : [],

    antecedents: f.antecedents ?? raw?.antecedents ?? "",

    // ---- SUIVI RAPPROCHÉ ----
    necessitatSuiviRapproche: f.necessitatSuiviRapproche ?? null,
    nePlusNecessiterSuivi:    f.nePlusNecessiterSuivi    ?? null,
    motifsSuiviRapproche:     Array.isArray(f.motifsSuiviRapproche) ? f.motifsSuiviRapproche : [],
    prochainVisiteMois:       f.prochainVisiteMois != null ? Number(f.prochainVisiteMois) : null,
  };
}
