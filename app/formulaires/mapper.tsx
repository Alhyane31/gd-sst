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

    // ---- INFORMATIONS PROFESSIONNELLES ----
    formation: f.formation?.libelle ?? p.formation?.libelle ?? "",
    service: f.service?.libelle ?? p.service?.libelle ?? "",
    dateAffectationChu: toDateInput(f.dateAffectation ?? p.dateAffectation),

    autreEtablissement: f.aTravailleHorsCHUIR == null ? "non" : f.aTravailleHorsCHUIR ? "oui" : "non",
    lieuTravail: f.autreLieuTravail ?? "",
    dureeAnnees: f.autreDureeAnnees == null ? "" : String(f.autreDureeAnnees),
    horaires: f.autreHoraires ?? "",

    // ---- RENSEIGNEMENTS PRO (si pas encore en DB -> reste vide)
    travailGarde: "non",
    heuresGarde: "",
    rythmeGarde: "",

    travailNuit: "non",
    nbNuitsMois: "",
    horairesNuit: "",

    // ---- ANTECEDENTS ----
    // pathologies du formulaire (tu as f.pathologies = [])
    pathologiesHistory: (f.pathologies ?? []).map((x: any) => ({
      cim11Code: x.cim11?.code ?? "",
      cim11Libelle: x.cim11?.libelle ?? "",
      date: toDateInput(x.date),
      commentaire: x.commentaire ?? "",
      source: x.source ?? "",
    })),
    pathologiesToAdd: [],

    antecedents: (f.data?.antecedents as string) ?? "",
  };
}