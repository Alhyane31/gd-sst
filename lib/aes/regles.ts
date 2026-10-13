// Règles automatiques (partie 2) et aides à la décision (annexes A, B, C).
// Ce sont des SUGGESTIONS : le médecin garde la main (bouton « Appliquer », valeurs modifiables).
import type { Alerte } from "@/lib/clinique/mesures";
import { nombreOuNull } from "@/lib/clinique/mesures";
import {
  EXPOSITION,
  liste,
  SOURCE,
  sourceInconnue,
  statutSource,
  type DeclarationData,
} from "./codes";
import { combinerDateHeure, heuresEntre, parseDateHeure } from "./delais";
import type { ReferentielAes } from "./referentiel";

export type NiveauRisque = "IMPORTANT" | "INTERMEDIAIRE" | "MINIME" | "PAS_DE_RISQUE";

export const NIVEAU_LIBELLES: Record<NiveauRisque, string> = {
  IMPORTANT: "Important",
  INTERMEDIAIRE: "Intermédiaire",
  MINIME: "Minime",
  PAS_DE_RISQUE: "Pas de risque",
};

/** Délai AES → déclaration, en heures (champs 1, 2, 3) */
export function delaiDeclarationHeures(d: DeclarationData): number | null {
  return heuresEntre(combinerDateHeure(d.dateAes, d.heureAes), parseDateHeure(d.dateHeureDeclaration));
}

// ─── Annexe A : niveau de risque ────────────────────────────────────────────────

/**
 * Niveau de risque suggéré.
 * Important : piqûre ou coupure profonde, ou aiguille creuse intravasculaire ou visiblement souillée.
 * Intermédiaire : coupure au bistouri, piqûre lors d'une injection IM/SC, aiguille pleine,
 *                 contact cutanéo-muqueux > 15 min.
 * Minime : autres cas (morsure, griffure, projection brève…). Projection sur peau saine : pas de risque.
 */
export function suggererNiveauRisque(d: DeclarationData): { niveau: NiveauRisque; motif: string } | null {
  const type = d.typeExposition as string | undefined;
  if (!type) return null;

  if (type === EXPOSITION.PROJ_PEAU_SAINE) return { niveau: "PAS_DE_RISQUE", motif: "projection sur peau saine" };

  if (type === EXPOSITION.PIQURE || type === EXPOSITION.COUPURE) {
    if (d.profondeur === "PROFONDE") return { niveau: "IMPORTANT", motif: "blessure profonde" };
    if (d.materiel === "AIGUILLE_CREUSE" && d.intravasculaire === "OUI") return { niveau: "IMPORTANT", motif: "aiguille creuse intravasculaire" };
    if (d.materiel === "AIGUILLE_CREUSE" && d.materielSouille === "OUI") return { niveau: "IMPORTANT", motif: "aiguille creuse visiblement souillée de sang" };
    if (type === EXPOSITION.COUPURE && d.materiel === "BISTOURI") return { niveau: "INTERMEDIAIRE", motif: "coupure au bistouri" };
    if (type === EXPOSITION.PIQURE && d.geste === "INJECTION_IM_SC") return { niveau: "INTERMEDIAIRE", motif: "piqûre IM ou SC" };
    if (d.materiel === "AIGUILLE_PLEINE") return { niveau: "INTERMEDIAIRE", motif: "aiguille pleine" };
    return { niveau: "MINIME", motif: "autre piqûre ou coupure" };
  }

  if (type === EXPOSITION.MORSURE_GRIFFURE) return { niveau: "MINIME", motif: "morsure ou griffure" };

  // projections sur muqueuse ou peau lésée
  if (d.dureeContact === "PLUS_15") return { niveau: "INTERMEDIAIRE", motif: "contact cutanéo-muqueux prolongé (> 15 min)" };
  return { niveau: "MINIME", motif: "projection brève" };
}

export function alerteNiveauRisque(d: DeclarationData): Alerte[] {
  const s = suggererNiveauRisque(d);
  if (!s) return [];
  const libelle = NIVEAU_LIBELLES[s.niveau];
  if (d.niveauRisque === s.niveau) return [];
  return [
    {
      severite: "info",
      message: `Annexe A : niveau suggéré « ${libelle} » (${s.motif}).${d.niveauRisque ? " Le niveau retenu diffère." : ""}`,
      appliquer: { libelle: "Appliquer", valeurs: { niveauRisque: s.niveau } },
    },
  ];
}

// ─── Annexe B : TPE VIH ─────────────────────────────────────────────────────────

export type SuggestionTpe = "RECOMMANDE" | "A_PROPOSER" | "NON_INDIQUE";

/** Niveau retenu par le médecin, à défaut le niveau suggéré */
function niveauEffectif(d: DeclarationData): NiveauRisque | undefined {
  return (d.niveauRisque as NiveauRisque | undefined) ?? suggererNiveauRisque(d)?.niveau;
}

export function suggererTpe(d: DeclarationData): SuggestionTpe | null {
  const vih = statutSource(d, "VIH");
  if (vih === SOURCE.POSITIF) return "RECOMMANDE";
  if (vih === SOURCE.NEGATIF) return "NON_INDIQUE";
  if (!d.statutSource && !d.patientSource) return null;
  // source inconnue (ou non identifiée) : risque important ET au moins un facteur de risque
  const facteurs = liste(d.facteursRisque).filter((f) => f !== "AUCUN");
  if (sourceInconnue(vih) && niveauEffectif(d) === "IMPORTANT" && facteurs.length > 0) return "A_PROPOSER";
  return "NON_INDIQUE";
}

export function alertesTpe(d: DeclarationData, ref: ReferentielAes): Alerte[] {
  const alertes: Alerte[] = [];
  const delai = delaiDeclarationHeures(d);

  if (delai !== null && delai > ref.seuils.delaiTpeHeures) {
    alertes.push({ severite: "error", message: `Délai AES > ${ref.seuils.delaiTpeHeures} h : TPE VIH en principe hors délai, avis du P23.` });
  }

  const s = suggererTpe(d);
  const cvIndetectable = liste(d.vihPositifDetails).includes("CV_INDETECTABLE");
  if (s === "RECOMMANDE") {
    alertes.push({
      severite: "warning",
      message: `Source VIH positive : TPE recommandé quel que soit le niveau de risque.${cvIndetectable ? " Charge virale indétectable : décision partagée avec l'expert." : ""}`,
    });
  } else if (s === "A_PROPOSER") {
    alertes.push({ severite: "warning", message: "Source VIH inconnue, risque important et facteur(s) de risque : TPE à proposer." });
  } else if (s === "NON_INDIQUE" && d.tpe !== "NON_INDIQUE") {
    alertes.push({
      severite: "info",
      message: "Annexe B : TPE VIH non indiqué selon les éléments saisis.",
      appliquer: { libelle: "Appliquer", valeurs: { tpe: "NON_INDIQUE" } },
    });
  }

  // source devenue négative pendant le suivi
  if (d.tpe === "ACCEPTE" && statutSource(d, "VIH") === SOURCE.NEGATIF) {
    alertes.push({ severite: "warning", message: "Source VIH négative : arrêt du TPE et du suivi VIH à envisager." });
  }

  // TPE accepté : créatinine et β-hCG au bilan initial
  if (d.tpe === "ACCEPTE") {
    const bilan = liste(d.bilanInitial);
    const manquants = ["CREATININE", "BHCG"].filter((b) => !bilan.includes(b));
    if (manquants.length) {
      alertes.push({
        severite: "info",
        message: "TPE accepté : créatinine et β-hCG à prévoir au bilan initial.",
        appliquer: { libelle: "Cocher", valeurs: { bilanInitial: [...bilan.filter((b) => b !== "NON_FAIT"), ...manquants] } },
      });
    }
  }
  return alertes;
}

// ─── Annexe C : prophylaxie VHB ─────────────────────────────────────────────────

export type StatutVhbVictime = "REPONDEUR" | "NON_REPONDEUR" | "NON_VACCINE" | "REPONSE_INCONNUE";

/** Vaccination incomplète ou inconnue : traitée comme non vacciné */
export function statutVhbVictime(d: DeclarationData, ref: ReferentielAes): StatutVhbVictime | null {
  if (!d.vaccinationVhb) return null;
  if (d.vaccinationVhb !== "COMPLETE") return "NON_VACCINE";
  const titre = nombreOuNull(d.titreAntiHbs);
  if (d.resultatAntiHbs === "REPONDEUR" || (titre !== null && titre >= ref.seuils.antiHbsRepondeur)) return "REPONDEUR";
  if (d.resultatAntiHbs === "NON_REPONDEUR" || (titre !== null && titre < ref.seuils.antiHbsRepondeur)) return "NON_REPONDEUR";
  return "REPONSE_INCONNUE";
}

/** Source Ag HBs : POSITIF, NEGATIF ou INCONNU (inconnu, en attente, source non identifiée) */
export function statutHbsSource(d: DeclarationData): "POSITIF" | "NEGATIF" | "INCONNU" {
  const s = statutSource(d, "AG_HBS");
  if (s === SOURCE.POSITIF) return "POSITIF";
  if (s === SOURCE.NEGATIF) return "NEGATIF";
  return "INCONNU";
}

export function suggererProphylaxieVhb(d: DeclarationData, ref: ReferentielAes): string[] | null {
  const victime = statutVhbVictime(d, ref);
  if (!victime || victime === "REPONSE_INCONNUE") return null;
  const source = statutHbsSource(d);
  if (victime === "REPONDEUR" || source === "NEGATIF") return ["NON_INDIQUEE"];
  if (victime === "NON_REPONDEUR") return source === "POSITIF" ? ["IMMUNOGLOBULINES"] : ["NON_INDIQUEE"];
  return source === "POSITIF" ? ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] : ["SCHEMA_VACCINAL"];
}

const PROPHYLAXIE_LIBELLES: Record<string, string> = {
  NON_INDIQUEE: "non indiquée",
  IMMUNOGLOBULINES: "immunoglobulines anti-HBs",
  DOSE_VACCIN: "dose de vaccin",
  SCHEMA_VACCINAL: "schéma vaccinal à débuter",
  TENOFOVIR: "ténofovir",
};

export function alertesVhb(d: DeclarationData, ref: ReferentielAes): Alerte[] {
  const victime = statutVhbVictime(d, ref);
  if (!victime) return [];
  if (victime === "REPONSE_INCONNUE") {
    return [{ severite: "info", message: "Vacciné, réponse anti-HBs inconnue : doser l'anti-HBs et se référer à l'annexe C." }];
  }
  const s = suggererProphylaxieVhb(d, ref);
  if (!s) return [];
  const actuel = liste(d.prophylaxieVhb);
  const identique = actuel.length === s.length && s.every((x) => actuel.includes(x));
  if (identique) return [];
  const exposeARisque = victime !== "REPONDEUR" && statutHbsSource(d) !== "NEGATIF";
  return [
    {
      severite: exposeARisque ? "warning" : "info",
      message: `Annexe C : prophylaxie VHB suggérée : ${s.map((x) => PROPHYLAXIE_LIBELLES[x]).join(" + ")}. Voir les notes * et ** de l'annexe.`,
      appliquer: { libelle: "Appliquer", valeurs: { prophylaxieVhb: s } },
    },
  ];
}

// ─── Autres règles de la partie 2 ───────────────────────────────────────────────

export function alerteSaignementProvoque(d: DeclarationData): Alerte[] {
  if (d.saignementProvoque === "SAIGNEMENT_PROVOQUE" || d.saignementProvoque === "COMPRESSION") {
    return [{ severite: "warning", message: "Geste déconseillé : ne pas faire saigner ni comprimer la plaie." }];
  }
  return [];
}
